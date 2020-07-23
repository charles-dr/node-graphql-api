function apiRequest(options) {
  const request = require('request');
  let res = '';
  request(options, (error, response) => {
    if (error) throw new Error(error);
    res = response.body;
  });
  const deasync = require('deasync');
  while ((res == '')) {
    deasync.runLoopOnce();
  }
  try {
    res = JSON.parse(res);
  } catch (e) {
    console.log('api request error', e);
    res = {
      state: -1,
      message: 'Api error',
    };
  }
  // console.log('response.status',res)
  return res;
}
const filter = {
  method: 'GET',
  url: '',
  headers: {
    Accept: 'application/json',
    'aftership-api-key': '08397112-8432-4756-b8ff-b51b57eea2cb',
  },
  body: '',
};
const baseUrl = 'https://api.aftership.com/v4';
function activatedCouriers() {
  filter.method = 'GET';
  filter.url = `${baseUrl}/couriers`;
  const result = apiRequest(filter);
  let res = {
    state: -1,
  };
  try {
    if (result.meta.code === 200) {
      const { data } = result;
      res = { state: 0, ...data };
      return res;
    }
  } catch (e) {
    console.log('activatedCouriers', result);
  }
  return { state: -1 };
}
function detectCouriers(trackingNumber) {
  filter.method = 'POST';
  filter.url = `${baseUrl}/couriers/detect`;
  filter.body = {
    tracking: {
      tracking_number: trackingNumber,
    },
  };
  const result = apiRequest(filter);
  return result;
}
function allCouriers() {
  filter.method = 'GET';
  filter.url = `${baseUrl}/couriers/all`;
  const result = apiRequest(filter);
  let res = {
    state: -1,
  };
  try {
    if (result.meta.code === 200) {
      const { data } = result;
      res = { state: 0, ...data };
      return res;
    }
  } catch (e) {
    console.log('activatedCouriers', result);
  }
  return { state: -1 };
}
module.exports = {
  activatedCouriers,
  detectCouriers,
  allCouriers,
};
