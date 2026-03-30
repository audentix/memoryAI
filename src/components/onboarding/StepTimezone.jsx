export default function StepTimezone({ timezone, setTimezone }) {
  const timezones = typeof Intl !== 'undefined' && Intl.supportedValuesOf
    ? Intl.supportedValuesOf('timeZone')
    : ['UTC', 'America/New_York', 'Europe/London', 'Asia/Kolkata', 'Asia/Tokyo'];

  return (
    <div>
      <h2 className="text-2xl font-bold text-text mb-2 text-center">Where are you based? 🌍</h2>
      <p className="text-text-muted mb-6 text-center">We'll use this for reminders and briefings.</p>
      <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="input-field">
        {timezones.map((tz) => (
          <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
        ))}
      </select>
    </div>
  );
}
