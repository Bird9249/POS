export function formatKip(amount: number): string {
  return `${new Intl.NumberFormat("lo-LA").format(amount)} ₭`;
}
