import axios  from "axios";
import qs from "qs"

export const environments = {
  staging: {
    url: "https://ngl-staging.unqork.io",
    username: "AQAPISTAGING",
  },
  qaUat: {
    url: "https://ngl-qa-uat.unqork.io",
    username: "aqqauatapids",
  },
  uat: {
    url: "https://ngl-uat.unqork.io",
    username: "uatapi",
  },
  prod: {
    url: "https://appqore.mynglic.com",
    username: "AQAPIDS",
  },
};

/**
 * Gets the bearer token
 * @param authTokenUrl
 * @param username
 * @param password
 * @returns {Promise<*>}
 */
export const getAuthToken = async (authTokenUrl, username, password) => {
  try {
    const authResult = await axios({
      method: "post",
      url: authTokenUrl,
      data: qs.stringify({
        grant_type: "password",
        username: username,
        password: password,
      }),
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
    });

    return authResult.data.access_token;
  } catch (err) {
    console.error(`An ERROR has occurred: ${err}`);
    throw err;
  }
};

/**
 * Sends a get request to Unqork REST API using the bearer token provided
 * @param url
 * @param authToken
 * @returns {Promise<*>}
 */
export const sendUnqorkApiGetRequest = async (url, authToken) => {
  try {
    const result = await axios({
      method: "get",
      url: url,
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    return result.data;
  } catch (err) {
    console.error(`An ERROR has occurred: ${err}`);
    throw err;
  }
};
