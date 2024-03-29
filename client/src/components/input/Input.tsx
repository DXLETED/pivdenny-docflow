import React, { useState } from 'react'
import st from 'styles/components/input/Input.module.sass'
import clsx from 'clsx'
import { Label } from 'components/input/Label'
import { ValidationErrors } from 'components/input/ValidationErrors'

interface InputProps {
  label?: string
  value?: string
  set: (value: string) => void
  type?: string
  placeholder?: string
  errors?: string[]
  required?: boolean
  showErrors?: boolean
  autoComplete?: string
}
export const Input: React.FC<InputProps> = ({ label, value = '', set, type, placeholder, errors, required, showErrors, autoComplete }) => {
  const [isEdited, setIsEdited] = useState(false)
  const onInput = (e: React.FormEvent): void => {
    const target = e.target as HTMLInputElement
    set(target.value)
    !isEdited && setIsEdited(true)
  }
  return (
    <div
      className={clsx(st.input, {
        [st.hasErrors]: (isEdited || showErrors) && errors?.length,
      })}>
      <Label text={label} required={required} />
      <div className={st.inner}>
        <input onInput={onInput} {...{ value, placeholder, type, autoComplete }} />
      </div>
      {errors && <ValidationErrors errors={errors} visible={isEdited || !!showErrors} />}
    </div>
  )
}
