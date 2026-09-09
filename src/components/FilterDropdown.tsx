export default function FilterDropdown({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select className="input !w-auto" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-[#0b1220]">{o.label}</option>
      ))}
    </select>
  );
}
