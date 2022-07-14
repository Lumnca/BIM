using Microsoft.AspNetCore.Mvc;
using WebApplication1.Models;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace WebApplication1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ValuesController : ControllerBase
    {
        // GET: api/<ValuesController>
        [HttpGet]
        public IEnumerable<string> Get()
        {
            
            return new string[] { "value1", "value2" };
        }

        // GET api/<ValuesController>/5
        [HttpGet("{id}")]
        public string Get(int id)
        {
            IFCTool.DecompressFile("test.gzip", "test.ifc");
            //IFCTool.CompressFile("abc.gzip");
            return "value";
        }

        // POST api/<ValuesController>
        [HttpPost]
        [DisableRequestSizeLimit]
        public ResFile Post(List<IFormFile> files)
        {
            ResFile result = new ResFile("", 0, 500);

            foreach (var formFile in files)
            {
                if (formFile.Length > 0)
                {
                    StreamReader reader = new StreamReader(formFile.OpenReadStream());
                    String content = reader.ReadToEnd();
                    String name = formFile.FileName;
                    String filename = "wwwroot/" + name;
                    if (System.IO.File.Exists(filename))
                    {
                        System.IO.File.Delete(filename);
                    }
                    using (FileStream fs = System.IO.File.Create(filename))
                    {
                        // 复制文件
                        formFile.CopyTo(fs);
                        // 清空缓冲区数据
                        fs.Flush();
                        FileInfo fileInfo = new FileInfo(filename);
                        result.size = fileInfo.Length;
                        result.fileName = fileInfo.Name;
                    }
                }
            }
            return result;

        }

        // PUT api/<ValuesController>/5
        [HttpPut("{id}")]
        public void Put(int id, [FromBody] string value)
        {
        }

        // DELETE api/<ValuesController>/5
        [HttpDelete("{id}")]
        public void Delete(int id)
        {
        }
    }
}
