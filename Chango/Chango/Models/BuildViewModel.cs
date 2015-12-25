using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Chango.Models
{
    public class BuildViewModel
    {
        public string CommanderName { get; set;}
        public string ShipName { get; set;}
        public string OriginalBuildName { get; set;}
        public string NewBuildName { get; set; }
        public List<ModuleBay> ModuleBays { get; set; }
    }
}