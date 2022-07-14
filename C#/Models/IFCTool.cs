using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Xbim.Ifc;
using Xbim.Ifc4.Interfaces;
using Xbim.Common;
using Xbim.IO;
using System.IO.Compression;

namespace WebApplication1.Models
{
  
    public class IFCTool
    {
        public static void check()
        {
            
            
        }
        public static void copy()
        {
            const string original = "wwwroot/model2.ifc";
            const string inserted = "wwwroot/new.ifc";
           /* List<string> str = new List<string>();
            str.Add("3B7pfUN_H6dOXsewpmnGyq");
            str.Add("2idC0G3ezCdhA9WVjWemcy");
            str.Add("2idC0G3ezCdhA9WVjWe$OA");
            str.Add("1s5utE$rDDfRKgzV6jUJ3d");*/


            PropertyTranformDelegate semanticFilter = (property, parentObject) =>
            {
                if (property.EntityAttribute.Order < 0 && !(property.PropertyInfo.Name == "StyledByItem"|| 
                property.PropertyInfo.Name == "HasOpenings" )){
                    return null;
                }
                return property.PropertyInfo.GetValue(parentObject, null);
            };
            using (var model = IfcStore.Open(original))
            {
                
                
                var walls = model.Instances.OfType("IFCWINDOW", true);
                using (var iModel = IfcStore.Create(model.SchemaVersion, XbimStoreType.InMemoryModel))
                {
                    using (var txn = iModel.BeginTransaction("Insert copy"))
                    {
                        //single map should be used for all insertions between two models
                        var map = new XbimInstanceHandleMap(model, iModel);

                        foreach (var wall in walls)
                        {
                            iModel.InsertCopy(wall, map, semanticFilter, true, false);
                   
                        
                        }

                        txn.Commit();
                    }
                    iModel.SaveAs(inserted);
                }
            }

        }
        //按照ID切分文件
        public static void copyByIds(String[] strings,string original,string inserted)
        {
            original = "wwwroot/" + inserted;
            inserted = "wwwroot/" + original;
            List<string> str = new List<string>(strings);
  
            PropertyTranformDelegate semanticFilter = (property, parentObject) =>
            {
                if (property.EntityAttribute.Order < 0 && !(property.PropertyInfo.Name == "StyledByItem" ||
                property.PropertyInfo.Name == "HasOpenings"))
                {
                    return null;
                }
                return property.PropertyInfo.GetValue(parentObject, null);
            };
            using (var model = IfcStore.Open(original))
            {
                var walls = model.Instances.Where<IIfcObject>(d => str.Contains(d.GlobalId));
                using (var iModel = IfcStore.Create(model.SchemaVersion, XbimStoreType.InMemoryModel))
                {
                    using (var txn = iModel.BeginTransaction("Insert copy"))
                    {
                        //single map should be used for all insertions between two models
                        var map = new XbimInstanceHandleMap(model, iModel);

                        foreach (var wall in walls)
                        {
                            iModel.InsertCopy(wall, map, semanticFilter, true, false);
                        }
                        txn.Commit();
                    }
                    iModel.SaveAs(inserted);
                }
            }
        }
        //按照类型切分文件
        public static ResFile copyByTypes(String[] types, string original)
        {
            string inserted = "wwwroot/" + original + "_" + types[types.Length-2]+".ifc";
           
            original = "wwwroot/" + original + ".ifc";

            ResFile resFile = new ResFile(inserted, 0, 500);


            PropertyTranformDelegate semanticFilter = (property, parentObject) =>
            {
                if (property.EntityAttribute.Order < 0 && !(property.PropertyInfo.Name == "StyledByItem" ||
                property.PropertyInfo.Name == "HasOpenings"))
                {
                    return null;
                }
                return property.PropertyInfo.GetValue(parentObject, null);
            };
            using (var model = IfcStore.Open(original))
            {
                var models = model.Instances.OfType(types[0], true);
                for (int i = 1; i < types.Length-2; i++)
                {
                    models = models.Concat(model.Instances.OfType(types[i], true));
                }
               
                using (var iModel = IfcStore.Create(model.SchemaVersion, XbimStoreType.InMemoryModel))
                {
                    using (var txn = iModel.BeginTransaction("Insert copy"))
                    {
                        //single map should be used for all insertions between two models
                        var map = new XbimInstanceHandleMap(model, iModel);

                        foreach (var m in models)
                        {
                            iModel.InsertCopy(m, map, semanticFilter, true, false);
                        }
                        txn.Commit();
                    }
                    iModel.SaveAs(inserted);
                    resFile.code = 200;
                }
            }
            FileInfo info = new FileInfo(inserted);
            resFile.size = info.Length;
            
            return resFile;

        }
        //GZIP压缩
        public static void CompressFile(String fileName)
        {
  
            using FileStream originalFileStream = File.Open("wwwroot/model.ifc", FileMode.Open);
            using FileStream compressedFileStream = File.Create("wwwroot/"+fileName);
            using var compressor = new GZipStream(compressedFileStream, CompressionMode.Compress);
            originalFileStream.CopyTo(compressor);
        }
        //GZIP解压
        public static void DecompressFile(String CompressedFileName,String DecompressedFileName)
        {
            using FileStream compressedFileStream = File.Open("wwwroot/"+ CompressedFileName, FileMode.Open);
            using FileStream outputFileStream = File.Create("wwwroot/" + DecompressedFileName);
            using var decompressor = new GZipStream(compressedFileStream, CompressionMode.Decompress);
            decompressor.CopyTo(outputFileStream);
            compressedFileStream.Close();  
            outputFileStream.Close();
        }


    }
}
