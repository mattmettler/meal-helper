#!/usr/bin/env python3
"""Replace the white background around dark artwork in a PNG with a solid color.

Only the white region connected to the image corner (the background) is
recolored. Enclosed white areas inside the artwork (a bird's face, belly,
wing stripes) stay white unless you name them with --fill-point. Edge pixels
are blended so there is no white halo.

Standard library only. Reads an 8-bit, non-interlaced RGB or RGBA PNG and
writes an opaque RGB PNG. With --center, the artwork is also shifted so its
bounding box is centered.

Example:
  python scripts/set-icon-background.py assets/icon/icon-source-1024.png \\
      assets/icon/icon-1024.png --color F6E3A1 --center
"""
import argparse
import struct
import sys
import zlib
from collections import deque

OUTSIDE_THRESHOLD = 128  # lightness above this counts as background when flood filling
EDGE_GROW_PIXELS = 2     # how far past the flood fill to blend antialiased edge pixels
INK_THRESHOLD = 120      # lightness below this counts as artwork when centering


def fail(message):
    sys.exit(f"error: {message}")


def read_png(path):
    data = open(path, "rb").read()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        fail(f"{path} is not a PNG file")
    pos, idat, header = 8, b"", None
    while pos < len(data):
        length, kind = struct.unpack(">I4s", data[pos:pos + 8])
        body = data[pos + 8:pos + 8 + length]
        if kind == b"IHDR":
            header = struct.unpack(">IIBBBBB", body)
        elif kind == b"IDAT":
            idat += body
        pos += 12 + length
    width, height, bit_depth, color_type, _, _, interlace = header
    if bit_depth != 8 or interlace != 0 or color_type not in (2, 6):
        fail(f"unsupported PNG (bit depth {bit_depth}, color type {color_type}, "
             f"interlace {interlace}); need 8-bit RGB or RGBA, not interlaced")
    channels = 3 if color_type == 2 else 4
    return width, height, channels, unfilter(zlib.decompress(idat), width, height, channels)


def unfilter(raw, width, height, channels):
    stride = width * channels
    out = bytearray(height * stride)
    for y in range(height):
        ftype = raw[y * (stride + 1)]
        line = raw[y * (stride + 1) + 1:(y + 1) * (stride + 1)]
        cur = y * stride
        prev = cur - stride
        for i in range(stride):
            left = out[cur + i - channels] if i >= channels else 0
            up = out[prev + i] if y else 0
            upleft = out[prev + i - channels] if (y and i >= channels) else 0
            if ftype == 0:
                add = 0
            elif ftype == 1:
                add = left
            elif ftype == 2:
                add = up
            elif ftype == 3:
                add = (left + up) >> 1
            elif ftype == 4:
                p = left + up - upleft
                pa, pb, pc = abs(p - left), abs(p - up), abs(p - upleft)
                add = left if (pa <= pb and pa <= pc) else (up if pb <= pc else upleft)
            else:
                fail(f"corrupt PNG: unknown filter type {ftype} on row {y}")
            out[cur + i] = (line[i] + add) & 0xFF
    return out


def write_png(path, width, height, rgb):
    rows = b"".join(b"\x00" + bytes(rgb[y * width * 3:(y + 1) * width * 3]) for y in range(height))

    def chunk(kind, body):
        crc = zlib.crc32(kind + body) & 0xFFFFFFFF
        return struct.pack(">I", len(body)) + kind + body + struct.pack(">I", crc)

    png = (b"\x89PNG\r\n\x1a\n"
           + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0))
           + chunk(b"IDAT", zlib.compress(rows, 9))
           + chunk(b"IEND", b""))
    open(path, "wb").write(png)


def center_artwork(rgb, width, height, bg):
    """Shift the dark artwork so its bounding box is centered; new edges get the background color."""
    xs, ys = [], []
    for y in range(height):
        for x in range(width):
            i = (y * width + x) * 3
            if (rgb[i] + rgb[i + 1] + rgb[i + 2]) / 3 < INK_THRESHOLD:
                xs.append(x)
                ys.append(y)
    if not xs:
        fail("no dark artwork found to center")
    dx = round((width - 1) / 2 - (min(xs) + max(xs)) / 2)
    dy = round((height - 1) / 2 - (min(ys) + max(ys)) / 2)
    shifted = bytearray(bytes(bg) * (width * height))
    for y in range(height):
        ny = y + dy
        if not 0 <= ny < height:
            continue
        for x in range(width):
            nx = x + dx
            if 0 <= nx < width:
                shifted[(ny * width + nx) * 3:(ny * width + nx) * 3 + 3] = rgb[(y * width + x) * 3:(y * width + x) * 3 + 3]
    print(f"centered artwork: shifted by ({dx}, {dy}) pixels")
    return shifted


def main():
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("input", help="source PNG with dark artwork on a white background")
    parser.add_argument("output", help="where to write the recolored opaque PNG")
    parser.add_argument("--color", required=True, help="background color as hex, e.g. F6E3A1")
    parser.add_argument("--fill-point", action="append", default=[], metavar="X,Y",
                        type=lambda v: tuple(int(p) for p in v.split(",")),
                        help="pixel in the input image inside an enclosed white area that should also "
                             "become background (repeatable), e.g. the gap between a bird's legs")
    parser.add_argument("--center", action="store_true",
                        help="also shift the artwork so its bounding box is centered in the image")
    args = parser.parse_args()

    try:
        bg = tuple(int(args.color.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4))
    except ValueError:
        fail(f"--color must be 6 hex digits like F6E3A1, got {args.color!r}")
    if len(args.color.lstrip("#")) != 6:
        fail(f"--color must be 6 hex digits like F6E3A1, got {args.color!r}")

    width, height, ch, px = read_png(args.input)
    count = width * height

    def pixel_rgb(i):
        return px[i * ch], px[i * ch + 1], px[i * ch + 2]

    def lightness(i):
        r, g, b = pixel_rgb(i)
        return (r + g + b) / 3

    light = [lightness(i) for i in range(count)]
    darkest = min(range(count), key=light.__getitem__)
    dark_l = light[darkest]
    dark_rgb = pixel_rgb(darkest)
    if light[0] <= OUTSIDE_THRESHOLD:
        fail("the top-left pixel is dark; expected a light background in the corner")

    # Flood fill the background from the corner, then from any --fill-point seeds
    # (white areas enclosed by the artwork that should also become background).
    outside = bytearray(count)

    def flood_fill(seed):
        outside[seed] = 1
        queue = deque([seed])
        filled = 1
        while queue:
            i = queue.popleft()
            x, y = i % width, i // width
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if 0 <= nx < width and 0 <= ny < height:
                    n = ny * width + nx
                    if not outside[n] and light[n] > OUTSIDE_THRESHOLD:
                        outside[n] = 1
                        queue.append(n)
                        filled += 1
        return filled

    flood_fill(0)
    for fx, fy in args.fill_point:
        if not (0 <= fx < width and 0 <= fy < height):
            fail(f"--fill-point {fx},{fy} is outside the {width}x{height} image")
        seed = fy * width + fx
        if light[seed] <= OUTSIDE_THRESHOLD:
            fail(f"--fill-point {fx},{fy} is on dark artwork; pick a point inside the white area")
        if outside[seed]:
            print(f"note: --fill-point {fx},{fy} is already part of the background")
        else:
            print(f"--fill-point {fx},{fy}: recolored a {flood_fill(seed)}-pixel enclosed area")

    # Grow the region so antialiased edge pixels get blended too.
    grown = bytearray(outside)
    for _ in range(EDGE_GROW_PIXELS):
        nxt = bytearray(grown)
        for i in range(count):
            if grown[i]:
                x, y = i % width, i // width
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < width and 0 <= ny < height:
                        nxt[ny * width + nx] = 1
        grown = nxt

    out = bytearray(count * 3)
    for i in range(count):
        if grown[i]:
            coverage = min(1.0, max(0.0, (255 - light[i]) / (255 - dark_l)))
            for c in range(3):
                out[i * 3 + c] = round(dark_rgb[c] * coverage + bg[c] * (1 - coverage))
        else:
            out[i * 3:i * 3 + 3] = bytes(pixel_rgb(i))

    if args.center:
        out = center_artwork(out, width, height, bg)

    write_png(args.output, width, height, out)
    print(f"wrote {args.output} ({width}x{height}), background #{args.color.lstrip('#').upper()}, "
          f"{sum(outside)} background pixels recolored before edge blending")


if __name__ == "__main__":
    main()
