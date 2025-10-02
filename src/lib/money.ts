export function formatMoney(a: number|null|undefined, c="USD", locale="en-US", fd=0){
  if (typeof a!=="number" || !isFinite(a)) return "-";
  return new Intl.NumberFormat(locale,{style:"currency",currency:c,minimumFractionDigits:fd,maximumFractionDigits:fd}).format(a);
}
