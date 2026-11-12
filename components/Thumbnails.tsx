/** Small hand-drawn previews for the gallery cards, so they stay crisp at any size. */

export function OrderBotThumb() {
  return (
    <svg viewBox="0 0 400 225" className="h-full w-full" role="img" aria-label="Preview: a chat on a phone next to an orders console">
      <rect width="400" height="225" className="fill-teal-50 dark:fill-teal-950/40" />
      <circle cx="350" cy="30" r="70" className="fill-teal-100 dark:fill-teal-900/30" />
      {/* phone */}
      <rect x="32" y="22" width="120" height="220" rx="18" className="fill-stone-900 dark:fill-stone-700" />
      <rect x="38" y="28" width="108" height="210" rx="13" className="fill-stone-100 dark:fill-stone-900" />
      <rect x="38" y="28" width="108" height="26" rx="13" className="fill-white dark:fill-stone-800" />
      <circle cx="54" cy="41" r="7" className="fill-teal-600" />
      <rect x="66" y="37" width="44" height="5" rx="2.5" className="fill-stone-300 dark:fill-stone-600" />
      <rect x="46" y="64" width="72" height="20" rx="8" className="fill-white stroke-stone-200 dark:fill-stone-800 dark:stroke-stone-700" />
      <rect x="76" y="92" width="62" height="16" rx="8" className="fill-teal-600" />
      <rect x="46" y="116" width="84" height="54" rx="8" className="fill-white stroke-stone-200 dark:fill-stone-800 dark:stroke-stone-700" />
      <rect x="54" y="125" width="50" height="4" rx="2" className="fill-stone-300 dark:fill-stone-600" />
      <rect x="54" y="135" width="62" height="4" rx="2" className="fill-stone-300 dark:fill-stone-600" />
      <rect x="54" y="145" width="40" height="4" rx="2" className="fill-stone-300 dark:fill-stone-600" />
      <rect x="54" y="157" width="68" height="5" rx="2.5" className="fill-teal-500/70" />
      <rect x="46" y="178" width="38" height="12" rx="6" className="fill-teal-600" />
      <rect x="88" y="178" width="44" height="12" rx="6" className="fill-teal-100 dark:fill-teal-900" />
      {/* console */}
      <rect x="176" y="40" width="200" height="160" rx="12" className="fill-white stroke-stone-200 dark:fill-stone-900 dark:stroke-stone-700" />
      <rect x="190" y="54" width="60" height="6" rx="3" className="fill-stone-800 dark:fill-stone-200" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x="190" y={74 + i * 36} width="172" height="28" rx="7" className={i === 0 ? "fill-teal-50 stroke-teal-500 dark:fill-teal-950/50" : "fill-white stroke-stone-200 dark:fill-stone-900 dark:stroke-stone-700"} />
          <rect x="198" y={82 + i * 36} width="70" height="5" rx="2.5" className="fill-stone-400 dark:fill-stone-500" />
          <rect x="198" y={91 + i * 36} width="44" height="4" rx="2" className="fill-stone-200 dark:fill-stone-700" />
          <rect x="318" y={83 + i * 36} width="36" height="10" rx="5" className={["fill-teal-600", "fill-sky-200 dark:fill-sky-900", "fill-amber-200 dark:fill-amber-900"][i]} />
        </g>
      ))}
      <rect x="190" y="182" width="120" height="4" rx="2" className="fill-stone-200 dark:fill-stone-700" />
    </svg>
  );
}

export function FieldSalesThumb() {
  return (
    <svg viewBox="0 0 400 225" className="h-full w-full" role="img" aria-label="Preview: a field-sales app with a route and progress">
      <rect width="400" height="225" className="fill-violet-50 dark:fill-violet-950/40" />
      <circle cx="60" cy="200" r="80" className="fill-violet-100 dark:fill-violet-900/30" />
      <rect x="140" y="14" width="120" height="230" rx="18" className="fill-stone-900 dark:fill-stone-700" />
      <rect x="146" y="20" width="108" height="220" rx="13" className="fill-stone-50 dark:fill-stone-900" />
      <rect x="154" y="34" width="92" height="44" rx="9" className="fill-violet-600" />
      <rect x="162" y="42" width="40" height="4" rx="2" className="fill-violet-200" />
      <rect x="162" y="51" width="56" height="8" rx="3" className="fill-white" />
      <rect x="162" y="65" width="76" height="4" rx="2" className="fill-violet-400" />
      <rect x="162" y="65" width="30" height="4" rx="2" className="fill-white" />
      <rect x="154" y="86" width="92" height="56" rx="9" className="fill-white stroke-stone-200 dark:fill-stone-800 dark:stroke-stone-700" />
      <polyline points="166,128 182,108 200,98 214,114 226,128 236,102" fill="none" className="stroke-violet-400" strokeWidth="2" strokeDasharray="3 3" />
      {[[166, 128, 1], [182, 108, 1], [200, 98, 0], [214, 114, 0], [226, 128, 0], [236, 102, 0]].map(([x, y, done], i) => (
        <circle key={i} cx={x} cy={y} r="5" className={done ? "fill-violet-600" : "fill-white stroke-violet-500 dark:fill-stone-800"} strokeWidth="1.5" />
      ))}
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x="154" y={150 + i * 22} width="92" height="18" rx="6" className="fill-white stroke-stone-200 dark:fill-stone-800 dark:stroke-stone-700" />
          <circle cx="164" cy={159 + i * 22} r="4" className={i === 0 ? "fill-violet-600" : "fill-stone-300 dark:fill-stone-600"} />
          <rect x="173" y={156 + i * 22} width="48" height="4" rx="2" className="fill-stone-300 dark:fill-stone-600" />
        </g>
      ))}
      <rect x="146" y="222" width="108" height="18" className="fill-white dark:fill-stone-800" />
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={i} cx={160 + i * 20} cy="230" r="3" className={i === 2 ? "fill-violet-600" : "fill-stone-300 dark:fill-stone-600"} />
      ))}
      {/* floating cards */}
      <rect x="286" y="54" width="92" height="40" rx="10" className="fill-white stroke-stone-200 dark:fill-stone-900 dark:stroke-stone-700" />
      <rect x="296" y="64" width="34" height="4" rx="2" className="fill-stone-300 dark:fill-stone-600" />
      <rect x="296" y="74" width="56" height="8" rx="3" className="fill-emerald-500/80" />
      <rect x="22" y="40" width="96" height="44" rx="10" className="fill-white stroke-stone-200 dark:fill-stone-900 dark:stroke-stone-700" />
      <rect x="32" y="50" width="40" height="4" rx="2" className="fill-stone-300 dark:fill-stone-600" />
      <rect x="32" y="60" width="18" height="16" rx="4" className="fill-violet-100 dark:fill-violet-900" />
      <rect x="54" y="60" width="18" height="16" rx="4" className="fill-violet-100 dark:fill-violet-900" />
      <rect x="76" y="60" width="18" height="16" rx="4" className="fill-violet-600" />
    </svg>
  );
}
