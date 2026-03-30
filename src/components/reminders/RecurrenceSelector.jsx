export default function RecurrenceSelector({ value, onChange }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="input-field">
      <option value="none">Don't repeat</option>
      <option value="daily">Daily</option>
      <option value="weekly">Weekly</option>
      <option value="monthly">Monthly</option>
    </select>
  );
}
