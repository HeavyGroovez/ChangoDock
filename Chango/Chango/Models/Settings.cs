using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Chango.Models
{
    [Serializable]
    public class Settings
    {
        public string CommanderName { get; set; }
        public bool SiriusDiscount { get; set;}
        public bool ShowModulePrices { get; set; }
    }
}