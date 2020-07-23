const TransactionRequest = require('../TransactionRequest');

describe('Wirecard', () => {
  it('should generate signature v2 (test 1)', () => {
    const request = new TransactionRequest({
      merchantId: '33f6d473-3036-4ca5-acb5-8c64dac862d1',
      secret: '9e0130f6-2e1e-4185-b0d5-dc69079c75cc',
      date: new Date('2017-03-23T09:14:51Z'),
      transactionId: 'A7B51ED4-9EB0-48D1-82AA-2145A7792C6B',
      transactionType: 'authorization',
      currencyAmount: 1.01,
      currency: 'EUR',
    });

    expect(request.getSignature()).toBe('SFMyNTYKcmVxdWVzdF90aW1lX3N0YW1wPTIwMTctMDMtMjNUMDk6MTQ6NTFaCm1lcmNoYW50X2FjY291bnRfaWQ9MzNmNmQ0NzMtMzAzNi00Y2E1LWFjYjUtOGM2NGRhYzg2MmQxCnJlcXVlc3RfaWQ9QTdCNTFFRDQtOUVCMC00OEQxLTgyQUEtMjE0NUE3NzkyQzZCCnRyYW5zYWN0aW9uX3R5cGU9YXV0aG9yaXphdGlvbgpyZXF1ZXN0ZWRfYW1vdW50PTEuMDEKcmVxdWVzdGVkX2Ftb3VudF9jdXJyZW5jeT1FVVI=.HZKtk+UfuA9IV6082jR+OLuZUZnlpSKW6lNFgZX2BEk=');
  });

  it('should generate signature v2 (test 2)', () => {
    const request = new TransactionRequest({
      merchantId: '61e8c484-dbb3-4b69-ad8f-706f13ca141b',
      secret: 'e94f5232-1171-4f03-a59e-67e3f2e7d374',
      date: new Date('2019-07-26T11:02:32+02:00'),
      transactionId: 'ec1c6f40-9811-4c31-936a-5e4ca9ba9003',
      transactionType: 'purchase',
      currencyAmount: 1.05,
      currency: 'EUR',
    });

    expect(request.getSignature()).toBe('SFMyNTYKcmVxdWVzdF90aW1lX3N0YW1wPTIwMTktMDctMjZUMDk6MDI6MzJaCm1lcmNoYW50X2FjY291bnRfaWQ9NjFlOGM0ODQtZGJiMy00YjY5LWFkOGYtNzA2ZjEzY2ExNDFiCnJlcXVlc3RfaWQ9ZWMxYzZmNDAtOTgxMS00YzMxLTkzNmEtNWU0Y2E5YmE5MDAzCnRyYW5zYWN0aW9uX3R5cGU9cHVyY2hhc2UKcmVxdWVzdGVkX2Ftb3VudD0xLjA1CnJlcXVlc3RlZF9hbW91bnRfY3VycmVuY3k9RVVS.padNDRF+M/7A24Q5urNLlx4KZoVGvS+hqnLwC4SgHf0=');
  });
});
