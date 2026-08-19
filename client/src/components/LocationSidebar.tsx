import { useMemo, useState } from 'react'
import { ChevronRight, Globe2 } from 'lucide-react'
import type { LocationGroup } from '../types'
import { getCountryName } from '../location'

export interface LocationFilter {
  country_code?: string
  state_code?: string
  city_name?: string
}

interface CityNode { name: string; count: number }
interface StateNode { code: string | null; name: string; count: number; cities: CityNode[] }
interface CountryNode { code: string; name: string; count: number; states: StateNode[] }

function buildTree(groups: LocationGroup[]): CountryNode[] {
  const countries = new Map<string, CountryNode>()

  for (const g of groups) {
    let country = countries.get(g.country_code)
    if (!country) {
      country = { code: g.country_code, name: g.country_name || getCountryName(g.country_code), count: 0, states: [] }
      countries.set(g.country_code, country)
    }
    country.count += g.count

    const stateKey = g.state_code ?? '__none__'
    let state = country.states.find((s) => (s.code ?? '__none__') === stateKey)
    if (!state) {
      state = { code: g.state_code, name: g.state_name ?? 'Other', count: 0, cities: [] }
      country.states.push(state)
    }
    state.count += g.count

    if (g.city_name) {
      state.cities.push({ name: g.city_name, count: g.count })
    }
  }

  for (const c of countries.values()) {
    c.states.sort((a, b) => b.count - a.count)
    for (const s of c.states) s.cities.sort((a, b) => b.count - a.count)
  }

  return [...countries.values()].sort((a, b) => b.count - a.count)
}

interface LocationSidebarProps {
  groups: LocationGroup[]
  filter: LocationFilter
  onFilterChange: (filter: LocationFilter) => void
}

export function LocationSidebar({ groups, filter, onFilterChange }: LocationSidebarProps) {
  const tree = useMemo(() => buildTree(groups), [groups])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function toggle(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const isEmpty = tree.length === 0

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={() => onFilterChange({})}
        className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm font-medium transition ${
          !filter.country_code ? 'bg-teal-50 text-teal-700' : 'text-stone-600 hover:bg-stone-100'
        }`}
      >
        <Globe2 size={15} /> All places
      </button>

      {isEmpty && <p className="px-2 py-1 text-xs text-stone-400">No entries yet</p>}

      {tree.map((country) => {
        const countryKey = country.code
        const countryOpen = expanded.has(countryKey)
        const countrySelected = filter.country_code === country.code && !filter.state_code && !filter.city_name
        return (
          <div key={countryKey}>
            <div
              className={`flex items-center gap-1 rounded-lg px-1 py-1 text-sm transition ${
                countrySelected ? 'bg-teal-50 text-teal-700' : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <button onClick={() => toggle(countryKey)} className="rounded p-0.5">
                <ChevronRight size={14} className={`transition ${countryOpen ? 'rotate-90' : ''}`} />
              </button>
              <button
                onClick={() => onFilterChange({ country_code: country.code })}
                className="flex-1 truncate text-left font-medium"
              >
                {country.name}
              </button>
              <span className="pr-1 text-xs text-stone-400">{country.count}</span>
            </div>

            {countryOpen && (
              <div className="ml-4 border-l border-stone-200 pl-2">
                {country.states.map((state) => {
                  const stateKey = `${countryKey}-${state.code ?? 'none'}`
                  const stateOpen = expanded.has(stateKey)
                  const stateSelected = filter.state_code === state.code && filter.country_code === country.code && !filter.city_name
                  const hasCities = state.cities.length > 0
                  return (
                    <div key={stateKey}>
                      <div
                        className={`flex items-center gap-1 rounded-lg px-1 py-1 text-sm transition ${
                          stateSelected ? 'bg-teal-50 text-teal-700' : 'text-stone-600 hover:bg-stone-100'
                        }`}
                      >
                        {hasCities ? (
                          <button onClick={() => toggle(stateKey)} className="rounded p-0.5">
                            <ChevronRight size={13} className={`transition ${stateOpen ? 'rotate-90' : ''}`} />
                          </button>
                        ) : (
                          <span className="w-[19px]" />
                        )}
                        <button
                          onClick={() => onFilterChange({ country_code: country.code, state_code: state.code ?? undefined })}
                          className="flex-1 truncate text-left"
                        >
                          {state.name}
                        </button>
                        <span className="pr-1 text-xs text-stone-400">{state.count}</span>
                      </div>

                      {stateOpen && hasCities && (
                        <div className="ml-4 border-l border-stone-200 pl-2">
                          {state.cities.map((city) => {
                            const citySelected =
                              filter.city_name === city.name &&
                              filter.country_code === country.code &&
                              filter.state_code === (state.code ?? undefined)
                            return (
                              <button
                                key={city.name}
                                onClick={() =>
                                  onFilterChange({
                                    country_code: country.code,
                                    state_code: state.code ?? undefined,
                                    city_name: city.name,
                                  })
                                }
                                className={`flex w-full items-center gap-1 rounded-lg px-1 py-1 pl-6 text-left text-sm transition ${
                                  citySelected ? 'bg-teal-50 text-teal-700' : 'text-stone-500 hover:bg-stone-100'
                                }`}
                              >
                                <span className="flex-1 truncate">{city.name}</span>
                                <span className="pr-1 text-xs text-stone-400">{city.count}</span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
