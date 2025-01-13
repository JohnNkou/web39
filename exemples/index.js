import Web39 from '../index.js'


let w = await Web39.createInstance("rs2216889","TWYmsFWq6f","egouv.online");

console.log(await w.get_zone_data('snip'));

w.close();