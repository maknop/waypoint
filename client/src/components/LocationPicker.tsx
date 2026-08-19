import { useMemo } from 'react'
import { Combobox } from './Combobox'
import { getCityOptions, getCountryName, getCountryOptions, getStateOptions } from '../location'

export interface LocationValue {
  country_code: string
  country_name: string
  state_code: string | null
  state_name: string | null
  city_name: string | null
}

interface LocationPickerProps {
  value: LocationValue
  onChange: (value: LocationValue) => void
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const countryOptions = useMemo(() => getCountryOptions(), [])
  const stateOptions = useMemo(
    () => (value.country_code ? getStateOptions(value.country_code) : []),
    [value.country_code],
  )
  const cityOptions = useMemo(
    () => (value.country_code ? getCityOptions(value.country_code, value.state_code) : []),
    [value.country_code, value.state_code],
  )

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-stone-500">Country</label>
        <Combobox
          options={countryOptions}
          value={value.country_code || null}
          onChange={(code) =>
            onChange({
              country_code: code ?? '',
              country_name: code ? getCountryName(code) : '',
              state_code: null,
              state_name: null,
              city_name: null,
            })
          }
          placeholder="Select country"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-stone-500">State / Region</label>
        <Combobox
          options={stateOptions}
          value={value.state_code}
          onChange={(code) =>
            onChange({
              ...value,
              state_code: code,
              state_name: stateOptions.find((o) => o.value === code)?.label ?? null,
              city_name: null,
            })
          }
          placeholder={stateOptions.length ? 'Select state' : 'No states'}
          disabled={!value.country_code || stateOptions.length === 0}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-stone-500">City</label>
        <Combobox
          options={cityOptions}
          value={value.city_name}
          onChange={(name) => onChange({ ...value, city_name: name })}
          placeholder={cityOptions.length ? 'Select city' : 'No cities found'}
          disabled={!value.country_code || cityOptions.length === 0}
        />
      </div>
    </div>
  )
}
