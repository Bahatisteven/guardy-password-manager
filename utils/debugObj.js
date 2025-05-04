import util from "util"; 

 export const debugObject = (obj) =>  {
  console.log(util.inspect(obj, { depth: null, colors: true }));
};