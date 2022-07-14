namespace WebApplication1.Models
{
    public class ResFile
    {
        public string fileName { get; set; }
        public long size { get; set; }
        public int code { get; set; }

        public ResFile(string fileName,long  size, int code)
        {
            this.fileName = fileName;
            this.size = size;
            this.code = code;
        }
    }
}
