const axios = require('axios');

/**
 * Create a user
 * @param {Object} nfeUrl
 * @returns {Promise<Any>}
 */
const getNfeHtml = async (nfeUrl) => {
  const response = await axios.get(nfeUrl);

  return response.data;
};

module.exports = {
  getNfeHtml,
};
