import qs from 'qs'

const defaultReqHeaders = {
	'Content-Type': 'application/json',
	'Accept': 'application/json',
}

async function request(
   baseApiUrl, host, getAuthHeader, onHttpError, onError,
   dispatch, getState, method,
   resourcePath, jsonBody, queryParams, includeAuthHeader = true
) {

	let reqHeaders = { ...defaultReqHeaders, 'Host': host } // clone the default headers
	if(includeAuthHeader) {
		reqHeaders = { ...reqHeaders, ...getAuthHeader(getState) }
	}
	// construct the fetch options including the message body and/or query params.
	var options = {
		method: method,
		headers: reqHeaders
	}
	let querystring = ''
	if(queryParams) {
		querystring = '?' + qs.stringify(queryParams)
	}
	if(jsonBody) {
		options.body = JSON.stringify(jsonBody)
	}

   let response = null

   try {
      response = await fetch(`${baseApiUrl}${resourcePath}${querystring}`, options)
      let json = await response.json()
      if(response.ok) { // 2XX
         return {
            ok: response.ok,
            status: response.status,
            json: json
         }
      } else { // 4XX, 5XX, ...
         throw {
            isHttpError: true,
            ok: false,
            status: response.status,
            json: json
         }
      }
   } catch(error) {
      if(error.isHttpError) {
         onHttpError(dispatch, error.status)
      } else {
         onError(dispatch, error)
      }
      throw error
   }

}

export default (baseApiUrl, host, getAuthHeader, onHttpError, onError) => {
	const configuredRequest = request.bind(null, baseApiUrl, host, getAuthHeader, onHttpError, onError)
	return (dispatch, getState) => {
	   return {
	      get: configuredRequest.bind(null, dispatch, getState, 'GET'),
	      post: configuredRequest.bind(null, dispatch, getState, 'POST'),
	      put: configuredRequest.bind(null, dispatch, getState, 'PUT'),
	      delete: configuredRequest.bind(null, dispatch, getState, 'DELETE')
	   }
	}
}
