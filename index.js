import https from 'https'
import { BASE_URL, LOGIN_URL, ZONE_PATH, ZONE_EDIT_PATH } from './src/endpoint.js'
import { get_response_data, get_session_cookies } from './src/utils.js'

let agent = new https.Agent({ keepAlive: true, keepAliveMsecs:300 })

export default class Web39{
	#security_token;
	#zone;
	#session_cookie;

	constructor(security_token,session_cookie,zone){
		if(!security_token || !zone || !session_cookie){
			throw Error("Should provide a security_token and a zone");
		}

		this.#security_token = security_token;
		this.#zone = zone;
		this.#session_cookie = session_cookie;
	}

	async get_zone_data(name){
		return new Promise((resolve,reject)=>{
			let data = `zone=${this.#zone}`,
			req = https.request(`${BASE_URL}/${this.#security_token}/${ZONE_PATH}`,{  
				agent,
				method:'POST',
				headers:{
					'Content-Type':'application/x-www-form-urlencoded',
					'Content-Length':Buffer.byteLength(data),
					'Cookie':this.#session_cookie
				}
			},async (res)=>{
				try{
					let payload = await get_response_data(res),
					zones = payload.data.reduce((x,y)=>{
						if(y.dname_b64 && y.record_type == 'A' && y.dname_b64 == btoa(name)){
							x.push({
								name: atob(y.dname_b64),
								record_type: y.record_type,
								ttl: y.ttl,
								data_b64: y.data_b64.map((d)=> atob(d)),
								line_index: y.line_index
							})
						}

						return x;
					},[]);

					resolve(zones);
				}
				catch(error){
					reject(error);
				}
			});

			req.end(data);
		})
	}

	async add_zone_data({name,ttl=120,ip, serial=10293890}){
		return new Promise((resolve,reject)=>{
			let data = `zone=${this.#zone}&serial=${serial}&add=${JSON.stringify({
				dname:`${name}.${this.#zone}.`, ttl, record_type:'A', line_index: null, data:[ip]
			})}`,
			req = https.request(`${BASE_URL}${this.#security_token}/${ZONE_EDIT_PATH}`,{
				agent,
				method:'POST',
				headers:{
					'Content-Type':'application/x-www-form-urlencoded',
					'Cookie': this.#session_cookie,
					'Content-Length': Buffer.byteLength(data)
				}
			},async (res)=>{
				try{
					let data = await get_response_data(res);

					if(data.status){
						resolve(true);
					}
					else{
						if(data.errors){
							let error = data.errors[0],
							serial = error.match(/\d{10}/g)[0];

							if(serial){
								await this.add_zone_data({ name,ttl, ip, serial });
							}
							else{
								console.error("No serial found in error",data.errors);
								return reject(new Error("No serial found"));
							}
						}
						else{
							console.log("ODD DATA",data);
							reject(new Error("Data couldn't be updated"));
						}
					}
				}
				catch(error){
					reject(error);
				}
			});

			console.log('DATA TO SEND',data);

			req.on('error',reject);

			req.end(data);
		})
	}

	async update_zone_data({name,ttl=120,ip, line_index, serial=10293890}){
		return new Promise((resolve,reject)=>{
			let data = `zone=${this.#zone}&serial=${serial}&edit=${JSON.stringify({
				dname:`${name}.${this.#zone}.`, ttl, record_type:'A', line_index, data:[ip]
			})}`,
			req = https.request(`${BASE_URL}${this.#security_token}/${ZONE_EDIT_PATH}`,{
				agent,
				method:'POST',
				headers:{
					'Content-Type':'application/x-www-form-urlencoded',
					'Cookie': this.#session_cookie,
					'Content-Length': Buffer.byteLength(data)
				}
			},async (res)=>{
				try{
					let data = await get_response_data(res);

					if(data.status){
						resolve(true);
					}
					else{
						if(data.errors){
							let error = data.errors[0],
							serial = error.match(/\d{10}/g)[0];

							if(serial){
								await this.update_zone_data({ name,ttl, ip, line_index, serial });
							}
							else{
								console.error("No serial found in error",data.errors);
								return reject(new Error("No serial found"));
							}
						}
						else{
							console.log("ODD DATA",data);
							reject(new Error("Data couldn't be updated"));
						}
					}
				}
				catch(error){
					reject(error);
				}
			});

			console.log('DATA TO SEND',data);

			req.on('error',reject);

			req.end(data);
		})
	}


	static async createInstance(user,pass,zone){
		return new Promise((resolve,reject)=>{
			let data = `user=${user}&pass=${pass}`,
			req = https.request(LOGIN_URL,{
				agent,
				method:'POST',
				headers:{
					'Content-Type':'application/x-www-form-urlencoded',
					'Content-Length':Buffer.byteLength(data)
				}
			},async (res)=>{
				try{
					let data = await get_response_data(res),
					security_token = data.security_token,
					session_cookie = get_session_cookies(res.headers);

					if(security_token){
						resolve(new Web39(security_token,session_cookie, zone));
					}
					else{
						console.error("BAD DATA",data);
						reject(new Error("No security_token found"));
					}
				}
				catch(error){
					reject(error);
				}
			});

			req.on('error',reject);

			req.on('timeout',reject);

			req.end(data);
		})
	}
}