// @ts-check

import axios from "axios";

const baseUrl = 'https://easy-file-share.vercel.app';
// const baseUrl = 'http://localhost:3001';

export const tunnel = {
  /**
   * @param {string} key
   * @returns {Promise<string | null>}
   */
  get: async (key) => {
    try {
      const res = await axios.get(`${baseUrl}/api/tunnels/${key}`);
      return res.data.url;
    } catch (error) {
      if (error.response.status === 404) {
        return null;
      } else {
        throw error;
      }
    }
  },

  /**
   * @param {string} id
   * @param {string} url
   * @returns {Promise<string | null>}
   */
  update: async (id, url) => {
    try {
      const res = await axios.put(`${baseUrl}/api/tunnels/${id}`, {
        url,
      });
      return res.data.id;
    } catch (error) {
      if (error.response.status === 404) {
        return null;
      } else {
        throw error;
      }
    }
  },

  /**
   * @param {string} url
   * @returns {Promise<{
   *  id: string,
   *  key: string,
   * }>}
   */
  create: async (url) => {
    const res = await axios.post(`${baseUrl}/api/tunnels`, {
      url,
    });
    return {
      id: res.data.id,
      key: res.data.key,
    };
  },
};