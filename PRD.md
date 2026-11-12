# Product Requirements Document
## Improvised Meal Guide

**Document Type:** High-Level Product Requirements & Technical Recommendation  
**Product:** Improvised Meal Guide  
**Version:** 1.0  

---

# 1. Product Overview

## 1.1 Product Description
Improvised Meal Guide is a mobile application designed to help users come up with easy, improvised meals through a guided, sequential decision-making process.
Rather than requiring users to plan meals in advance, maintain an inventory of available ingredients, or follow existing meals, the application walks users through a series of choices that progressively determine the composition of a meal.
Users select from predefined options at each stage. Available options in subsequent stages may be influenced by selections made in previous stages.
Once the process is complete, the application generates a meal summarizing the user's selections, accompanied by cooking instructions and practical tips tailored to the resulting combination.
Users can customize the available selection options over time and save completed meals for future reference.

## 1.2 Product Goals
The primary goals are:
1. Make it easy for users to come up with a meal without having to independently brainstorm an entire meal.
2. Guide users through a logical sequence of decisions that progressively builds a cohesive meal.
3. Generate useful, understandable meals based on the user's selections.
4. Allow users to customize the application's available choices to reflect their personal preferences.
5. Maintain a persistent collection of previously generated meals.

## 1.3 Product Scope
The application will be a standalone mobile application accessible from a home-screen icon on both iOS and Android devices.
It will operate entirely offline following initial installation. Application code, assets, configuration, user-created options, and saved meals will be stored locally on the device.
The application will not require:
- User accounts or authentication.
- Cloud hosting or an application backend.
- External APIs or online services.
- Internet connectivity during normal operation.

The application will not maintain an inventory of ingredients in the user's kitchen.

---

# 2. Functional Requirements

## 2.1 Guided Meal Creation
The primary functionality is a sequential, guided meal-building experience.
Users will progress through a series of steps, with each step addressing a different aspect of the meal being created.
Each step will present a predefined collection of selectable options.

Requirements:
- Users must be able to select from the available options at each step.
- The application must present steps in a defined sequence.
- Available options in subsequent steps may be determined or filtered based on selections made during previous steps.
- The application must maintain the user's selections throughout the meal-building process.
- The application must use the completed set of selections as the basis for generating the final meal.

The specific steps, option categories, and decision-making relationships will be defined during detailed product design.

## 2.2 Conditional Selection Logic
The application must support relationships between selections made during different stages of the meal-building process.
For example, a selection made in an earlier step may influence which options are presented in a subsequent step.

Requirements:
- Selection logic must be configurable.
- Multiple selection categories and relationships must be supported.
- The application must be able to determine which options are appropriate based on previous selections.
- The selection logic must operate locally without requiring external services.

The recommended implementation is a rules-based decision engine rather than a dependency on generative AI.

## 2.3 Option Management
Users must be able to customize the predefined options available throughout the meal-building process.

Requirements:
- Users can add new options to a selection category.
- Newly created options must persist locally.
- Newly created options must be available for selection in future meal-building sessions.
- Users can delete existing options.
- Deletion of an option must not affect previously saved meals containing that selection.

The application must distinguish between the underlying option library and the selections recorded in completed meals.

## 2.4 Meal Generation
Upon completing the guided selection process, the application must generate a meal representing the resulting meal.

The generated meal must:
- Summarize the selections made during the meal-building process.
- Present the resulting meal in an easy-to-understand visual format.
- Include practical cooking tips based on the selected ingredients and preparation choices.

Meal generation should account for relationships between selected components rather than simply displaying a list of the user's selections.
For example, cooking tips should reflect relevant preparation techniques, cooking order, and ingredient-specific considerations.
The “meals” are NOT recipes, there will be no instructions, cook times, anything like that. The tips provided will be based on the individual components selected, and potentially some component combinations, but they are directly connected to the components and are not instructions or a cohesive recipe.
Meal generation must function entirely offline.

## 2.5 Saved Meals
Users must be able to save completed meals for future reference.

Requirements:
- Completed meals can be saved locally.
- Saved meals must remain accessible across application sessions.
- Users can view previously saved meals.
- Saved meals must preserve the selections and meal content associated with their original creation.
- Users can mark meals as favorites.
- Users can sort their saved meals by favorite status.

The saved meal collection must remain independent of the current selection-option library.
Changes to available options must not modify previously saved meals.

---

# 3. Nonfunctional Requirements

## 3.1 Offline Operation
The application must function without internet connectivity following initial installation.
All application functionality must be available offline, including:
- Navigating the application.
- Completing the guided meal-building process.
- Applying conditional selection logic.
- Adding and deleting selection options.
- Generating meals.
- Saving and retrieving meals.
- Managing favorites.

All required application resources must be available locally.

## 3.2 Cross-Platform Compatibility
The application must support:
- iOS devices.
- Android devices.

The intended installation experience is through the device's browser, using its Add to Home Screen functionality.
The application should launch from a home-screen icon in a standalone application-like presentation rather than requiring users to navigate to a website.

## 3.3 Local Data Storage
All user-created and application-generated data must be stored locally on the device.
The application must not depend on remote databases, cloud synchronization, or external services.

## 3.4 Persistence
User-created options and saved meals must persist between application sessions.
The application should use browser storage mechanisms appropriate for installed PWAs.
Because iOS may manage or evict website storage under certain circumstances, local persistence should be implemented with appropriate consideration for platform-specific storage behavior.

---

# 4. Technical Architecture Recommendation

## 4.1 Recommended Technology Stack
The recommended architecture is a Progressive Web Application (PWA) built using modern web technologies.

| Layer | Recommended Technology | Purpose |
| :--- | :--- | :--- |
| Application framework | React | User interface and application structure |
| Programming language | TypeScript | Application logic and data structures |
| Styling | CSS | Visual presentation and responsive layouts |
| Build tooling | Vite | Application compilation and bundling |
| PWA functionality | Web App Manifest | Home-screen installation and application metadata |
| Offline functionality | Service Worker | Local caching and offline application access |
| Local database | IndexedDB via Dexie.js | Persistent application data |
| Decision engine | TypeScript rules engine | Conditional selection logic |
| Development assistance | Codex or Claude Code | AI-assisted application development |

### Rationale
This architecture provides a relatively lightweight development environment while supporting the required functionality on both major mobile platforms.
It avoids the complexity of maintaining separate native iOS and Android applications.
It also allows the application to be developed and maintained using familiar web development technologies.

## 4.2 PWA Installation and Distribution
The application will be initially hosted at a secure HTTPS location for installation.
The installation process will be:
1. Build and deploy the PWA to an HTTPS location.
2. Open the application using the mobile device's browser.
3. Install the application using the browser's home-screen installation functionality.
4. Ensure all required application resources are cached locally.
5. Verify that the installed application functions without internet connectivity.

After successful installation, the hosting environment can be discontinued.
The application must not require continued access to its original hosting location to function.
Future application updates would require temporarily restoring the same hosting origin and updating the locally installed application.
No recurring application signing or native application distribution process should be required.

## 4.3 Offline Architecture
A service worker will manage the application's offline resources.
The initial installation process must ensure that all required resources are available locally, including:
- HTML.
- JavaScript bundles.
- CSS.
- Images and icons.
- Application configuration.
- Other required static assets.

The service worker should use a cache-first approach for application resources, ensuring that normal application usage does not require network access.
The application must not load dependencies from external CDNs or remote resources.

## 4.4 Local Data Storage
IndexedDB is recommended as the primary persistence mechanism.
Dexie.js is recommended as an abstraction layer to simplify database operations.
IndexedDB is appropriate for this application because its data requirements are relatively modest and primarily consist of structured records.
It also supports storing structured data and binary assets locally.

---

# 5. Suggested Data Model
The following is a proposed high-level data model. Specific fields and relationships can be refined during implementation.

## 5.1 Selection Steps
Represents the individual stages of the meal-building process.
Suggested fields:

| Field | Description |
| :--- | :--- |
| id | Unique step identifier |
| name | Step name |
| description | Optional instructional text |
| sequence | Position in the meal-building process |
| active | Whether the step is currently available |

## 5.2 Selection Options
Represents the available choices within each step.
Suggested fields:

| Field | Description |
| :--- | :--- |
| id | Unique option identifier |
| stepId | Associated selection step |
| name | Option name |
| description | Optional description |
| isCustom | Indicates whether the user created the option |
| active | Whether the option is available |

Options should be stored independently of saved meals.

## 5.3 Selection Rules
Represents the conditional relationships between selections.
Suggested fields:

| Field | Description |
| :--- | :--- |
| id | Unique rule identifier |
| sourceStepId | Step containing the triggering selection |
| sourceOptionId | Selection that triggers the rule |
| targetStepId | Step affected by the rule |
| targetOptionIds | Options affected by the rule |
| action | Defines how the rule affects availability |

The rule structure should support multiple conditions and relationships where needed.

## 5.4 Cooking Guidance
Represents the cooking instructions and tips used during meal generation.
Suggested fields:

| Field | Description |
| :--- | :--- |
| id | Unique guidance identifier |
| applicableOptions | Associated selections |
| instruction | Cooking instruction or tip |
| category | Type of guidance |
| priority | Relative importance or display order |

This data will allow meal generation to select relevant guidance based on the completed combination of choices.

## 5.5 Saved Meals
Represents completed meals retained by the user.
Suggested fields:

| Field | Description |
| :--- | :--- |
| id | Unique meal identifier |
| name | Generated meal name |
| description | Meal summary |
| selections | Snapshot of the original selections |
| ingredients | Generated ingredient list |
| instructions | Generated cooking instructions |
| tips | Contextual cooking tips |
| isFavorite | Favorite status |
| createdAt | Creation timestamp |

The selections, ingredients, instructions, and tips should be preserved as part of the saved meal rather than dynamically reconstructed from the current option library.

## 5.6 Application Settings
Represents locally stored application preferences and configuration.
Suggested fields:

| Field | Description |
| :--- | :--- |
| id | Setting identifier |
| value | Stored setting value |

---

# 6. Meal Generation Architecture
Meal generation should be implemented as a deterministic, locally executed process.
The recommended approach is to combine three components:
1. **Selection aggregation:** Collect the choices made throughout the guided meal-building process.
2. **Meal templates and rules:** Use the selected meal format and ingredient combinations to determine an appropriate meal structure.
3. **Cooking guidance:** Select applicable cooking tips based on the chosen ingredients and preparation characteristics.

The output should be a structured meal containing a title, summary, ingredient selections, and relevant tips.
This approach provides predictable results without requiring an external AI service or internet connectivity.

---

# 7. Development and Testing Considerations
The application should be developed and tested against the following requirements:
- Verify successful installation on actual iOS and Android devices.
- Verify that the application launches from its home-screen icon.
- Verify that the application works with the device in airplane mode.
- Verify that user-created options persist between sessions.
- Verify that deleting an option does not modify saved meals.
- Verify that saved meals retain their original selections and instructions.
- Verify that favorite status persists.
- Verify that conditional selection rules produce the intended available options.
- Verify that meal generation produces appropriate instructions for supported selection combinations.

Testing should include both the initial installation experience and subsequent offline usage.

---

# 8. Scope Summary
The initial product release should focus on the following capabilities:
1. A sequential guided meal-building process.
2. Conditional selection options based on previous choices.
3. User-managed selection options, including adding and deleting choices.
4. Locally generated meals with contextual cooking tips.
5. Persistent local meal storage.
6. Meal favorites and sorting.
7. Offline operation on iOS and Android.
8. Home-screen installation without native application signing or recurring hosting.

The application should remain focused on its primary purpose: helping users improvise easy meals through a guided decision-making experience.

---

# 9. Suggested Additional Features and Functionality
The following are potential future enhancements. They are not requirements for the initial release.

| Feature | Description |
| :--- | :--- |
| Edit existing options | Allow users to modify the names or descriptions of existing choices. |
| Reorder options | Allow users to control the order in which choices appear. |
| Option favorites | Allow frequently selected options to appear more prominently. |
| Surprise Me | Randomly generate compatible selections for users who want inspiration. |
| Meal complexity preference | Allow users to favor simpler or more involved meal combinations. |
| Ingredient substitutions | Suggest alternatives for selected ingredients. |
| Serving adjustments | Allow users to change serving counts and adjust ingredient quantities. |
| Cooking mode | Present cooking instructions in a simplified, step-by-step format. |
| Meal search | Search saved meals by name or ingredient. |
| Meal editing | Allow users to modify previously saved meals. |
| Meal duplication | Create a new meal based on an existing saved meal. |
| Data backup and restoration | Export and import locally stored application data. |
| Meal imagery | Associate generated meals with locally stored images or illustrations. |

These enhancements can be evaluated individually after the initial application is functional and its core experience has been validated.

---
**End of Document**