export function selectedTransactionIds(transactions, excludedIds) {
  return new Set(transactions
    .filter(({ id }) => !excludedIds.has(id))
    .map(({ id }) => id));
}
