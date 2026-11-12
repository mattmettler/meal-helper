import { STEPS } from '../../logic/steps'
import type { Meal } from '../../logic/types'
import { stepClass } from '../stepTheme'

export function MealGroups({ groups }: { groups: Meal['groups'] }) {
  return (
    <>
      {groups.map(group => {
        const step = STEPS.find(s => s.name === group.stepName)
        return (
          <div key={group.stepName} className={`card ${step ? stepClass(step.id) : ''}`}>
            <span className="group-label">{group.stepName}</span>
            {group.items.map(item => (
              <div key={item.optionName}>
                <div className="pick">{item.optionName}</div>
                {item.tips.map(tip => <p key={tip} className="tip">{tip}</p>)}
              </div>
            ))}
          </div>
        )
      })}
    </>
  )
}
