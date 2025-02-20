import { useCallback } from 'react'
import { useIntl } from 'react-intl'

export type TranslatorFnTypeDefinition = (key: string, values?: Record<string, string | number>) => string

const useTranslation = (): TranslatorFnTypeDefinition => {
  const intl = useIntl()
  const t = useCallback(
    (key: string, values?: Record<string, string | number>) => {
      return intl.formatMessage({ id: key }, values)
    },
    [intl]
  )

  return t
}

export default useTranslation