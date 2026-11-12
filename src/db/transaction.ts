/**
 * Transaction xếp hàng. `SQLiteProvider` dùng một kết nối chung, và `withTransactionAsync` chỉ là
 * BEGIN … COMMIT trên kết nối đó. Hai transaction chạy chồng nhau (ví dụ bấm Lưu hai lần) thì BEGIN
 * thứ hai lỗi "cannot start a transaction within a transaction", rồi ROLLBACK của nó hủy luôn
 * transaction đầu, nên COMMIT đầu lỗi "cannot commit - no transaction is active". Hàng đợi ở JS
 * giữ cho mỗi lúc chỉ có một transaction.
 */
type TransactionDb = { withTransactionAsync(task: () => Promise<void>): Promise<void> };

let queue: Promise<unknown> = Promise.resolve();

export function transaction(db: TransactionDb, task: () => Promise<void>): Promise<void> {
  const run = queue.then(() => db.withTransactionAsync(task));
  // Transaction trước lỗi không chặn transaction sau.
  queue = run.catch(() => undefined);
  return run;
}
