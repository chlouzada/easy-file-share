const axios = require('axios');

/**
 * @param {string} id
 * @returns {Promise<{
 *  name: string,
 *  encoded: string
 * } | null>}
 */
const load = async (id) => {
  try {
    const res = await axios.get(
      `https://easy-file-share.vercel.app/api/files?id=${id}`
    );
    return {
      name: res.data.name,
      encoded: res.data.encoded,
    };
  } catch (error) {
    if (error.response.status === 404) {
      return null;
    } else {
      throw error;
    }
  }
};

/**
 * @param {string} name
 * @param {string} encoded
 * @returns {Promise<string>}
 */
const save = async (name, encoded) => {
  const res = await axios.post(
    `https://easy-file-share.vercel.app/api/files`,
    {
      name,
      encoded,
    }
  );
  return res.data.id;
};

module.exports = {
  load,
  save,
};
