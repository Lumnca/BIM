using Microsoft.AspNetCore.Mvc;
using WebApplication1.Models;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace WebApplication1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class IfcController : ControllerBase
    {
        // GET: api/<ValuesController1>
        [HttpGet]
        public IEnumerable<string> Get()
        {
            return new string[] { "value1", "value2" };
        }

        // GET api/<ValuesController1>/5
        [HttpGet("{id}")]
        public string Get(int id)
        {
            return "value";
        }

        // POST api/<ValuesController1>
        [HttpPost]
        public ResFile Post(String[] strs)
        {
            if (strs.Length < 2) return new ResFile("empty",0,500);
            return IFCTool.copyByTypes(strs, strs[strs.Length - 1]);
        }
        [HttpPost("/auto")]
        public List<ResFile> Auto(String[] strs)
        {
            List<ResFile> list = new List<ResFile>();
            for (int i = 0; i < strs.Length; i++)
            {
                //list.Add(IFCTool,)
            }
            return list; 
        }

        // PUT api/<ValuesController1>/5
        [HttpPut("{id}")]
        public void Put(int id, [FromBody] string value)
        {
        }

        // DELETE api/<ValuesController1>/5
        [HttpDelete("{id}")]
        public void Delete(int id)
        {
        }
    }
}
