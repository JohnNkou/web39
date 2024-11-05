export function get_response_data(res){
		return new Promise((resolve,reject)=>{
			let data = '';

			res.on('data',(chunk)=>{
				data += chunk.toString();
			})

			res.on('error',(error)=>{
				reject(error);
			})

			res.on('end',()=>{
				try{
					data = JSON.parse(data);

					resolve(data);
				}
				catch(error){
					reject(error);
				}
			})
		})
	}

export function get_session_cookies(headers){
	let setCookies = headers['set-cookie'],
	sessionCookie = setCookies.find((cookies)=> cookies.indexOf('cpsession') != -1);

	return sessionCookie.split(';')[0].trim();
}