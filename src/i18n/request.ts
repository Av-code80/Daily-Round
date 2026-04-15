
// requestLocale — the locale extracted from the URL by the middleware

import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

export default getRequestConfig(async ({requestLocale}) => {
    let locale = await requestLocale
    if (!locale || !routing.locales.includes(locale as 'en' | 'fr')) {
        locale = routing.defaultLocale
    }
    return {
        locale: locale,
        messages: (await import(`../../messages/${locale}.json`)).default,
    }
})