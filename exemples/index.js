import Web39 from '../index.js'


let w = await Web39.createInstance("rs2216889","TWYmsFWq6f","egouv.online"),
data = await w.get_zone_data('snip');

console.log(await w.add_zone_data({ name:'snip', ip:'youtube.com', record_type:'CNAME' }))