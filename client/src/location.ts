import { Country, State, City } from 'country-state-city'

export interface Option {
  value: string
  label: string
}

export function getCountryOptions(): Option[] {
  return Country.getAllCountries()
    .map((c) => ({ value: c.isoCode, label: `${c.flag} ${c.name}` }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

export function getCountryName(isoCode: string): string {
  return Country.getCountryByCode(isoCode)?.name ?? isoCode
}

export function getStateOptions(countryCode: string): Option[] {
  return State.getStatesOfCountry(countryCode)
    .map((s) => ({ value: s.isoCode, label: s.name }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

export function getCityOptions(countryCode: string, stateCode: string | null): Option[] {
  const cities = stateCode
    ? City.getCitiesOfState(countryCode, stateCode)
    : City.getCitiesOfCountry(countryCode) ?? []
  const seen = new Set<string>()
  const options: Option[] = []
  for (const c of cities) {
    if (seen.has(c.name)) continue
    seen.add(c.name)
    options.push({ value: c.name, label: c.name })
  }
  return options.sort((a, b) => a.label.localeCompare(b.label))
}
