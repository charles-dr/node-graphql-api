const jwt = require('jsonwebtoken');
const { AuthenticationError } = require('apollo-server');
const JWT_REGEX = /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/;
const logger = require('../../config/logger');

function fetchAuthorization({ req, connection }) {
  if (connection) {
    return connection.context.authorization || connection.context.Authorization || null;
  }
  return req.headers && (req.headers.authorization || null);
}

function fetchJWT(authorization) {
  if (authorization.indexOf('Bearer') !== 0) {
    return null;
  }

  const token = authorization.substr(7);
  if (!JWT_REGEX.test(token)) {
    return null;
  }

  return token;
}

module.exports = (repository) => async (request) => {
  const authorization = fetchAuthorization(request);
  if (!authorization) {
    return {};
  }

  const token = fetchJWT(authorization);
  if (!token) {
    return {};
  }

  const data = jwt.decode(token);
  if (!data) {
    return {};
  }
  if (!data.id || !data.user_id || !data.exp) {
    return {};
  }

  const accessToken = await repository.accessToken.load(data.id);
  try {
    jwt.verify(token, accessToken.secret);
  } catch (error) {
    // throw new AuthenticationError('Invalid token');
    return {};
  }

  const user = await repository.user.load(accessToken.user);
  return { user };
};
