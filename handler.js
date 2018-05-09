"use strict"

const bluebird = require("bluebird")
const maxmind = require("maxmind")
const openDb = bluebird.promisify(maxmind.open)

let cityLookup,
	countryLookup = null

module.exports.fetchLocationData = async event => {
	if (event.source === 'serverless-plugin-warmup') {
		console.log('WarmUP - Lambda is warm!')
		return Promise.resolve('Lambda is warm!')
	}

	if (!cityLookup) {
		cityLookup = await openDb("./GeoLite2-City.mmdb")
	}
	if (!countryLookup) {
		countryLookup = await openDb("./GeoLite2-Country.mmdb")
	}

	let ip, cityData, countryData
	try {
		ip = event.requestContext.identity.sourceIp
		cityData = await cityLookup.get(ip)
		countryData = await countryLookup.get(ip)
	} catch (e) {
		console.log("Lookup failed!", e)
		const response = {
			statusCode: 500,
			body: JSON.stringify({
				success: false,
				error: e
			})
		}
		return Promise.resolve(response)
	}

	const response = {
		statusCode: 200,
		body: JSON.stringify({
			success: true,
			ip: ip,
			city: cityData,
			country: countryData
		})
	}
	return Promise.resolve(response)
}
