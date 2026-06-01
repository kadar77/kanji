import { Icon } from '@/components/Icon'

type Props = {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}

export function SearchBar({ value, onChange, placeholder = 'Search kanji, meaning, reading…' }: Props) {
  return (
    <div className="search-bar">
      <Icon name="search" size={16} stroke={1.8} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search"
      />
      {value && (
        <button
          type="button"
          className="iconbtn"
          style={{ width: 24, height: 24 }}
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          <Icon name="x" size={14} />
        </button>
      )}
    </div>
  )
}
