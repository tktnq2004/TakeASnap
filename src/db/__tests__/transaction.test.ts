import { transaction } from '../transaction';

/** Giả lập kết nối SQLite chung: BEGIN khi đang có transaction thì lỗi như SQLite thật. */
function fakeDb() {
  let open = false;
  const log: string[] = [];
  return {
    log,
    async withTransactionAsync(task: () => Promise<void>) {
      if (open) throw new Error('cannot start a transaction within a transaction');
      open = true;
      log.push('BEGIN');
      try {
        await task();
        log.push('COMMIT');
      } finally {
        open = false;
      }
    },
  };
}

const tick = () => new Promise((r) => setTimeout(r, 0));

describe('transaction', () => {
  it('chạy lần lượt khi gọi cùng lúc', async () => {
    const db = fakeDb();
    await Promise.all([
      transaction(db, async () => {
        await tick();
        db.log.push('a');
      }),
      transaction(db, async () => {
        db.log.push('b');
      }),
    ]);
    expect(db.log).toEqual(['BEGIN', 'a', 'COMMIT', 'BEGIN', 'b', 'COMMIT']);
  });

  it('transaction lỗi không chặn transaction sau', async () => {
    const db = fakeDb();
    const first = transaction(db, async () => {
      throw new Error('hỏng');
    });
    const second = transaction(db, async () => {
      db.log.push('b');
    });
    await expect(first).rejects.toThrow('hỏng');
    await expect(second).resolves.toBeUndefined();
    expect(db.log).toContain('b');
  });
});
