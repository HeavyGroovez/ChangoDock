using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Linq;
using System.Net;
using System.Web;
using System.Web.Mvc;
using Chango.Models;
using System.Diagnostics;

namespace Chango.Helpers
{
    public static class Render
    {
        
        public static string GetModuleBayClass(string moduleSection, int moduleClass)
        {

            if (moduleSection == "Hardpoint")
            {
                switch (moduleClass)
                {
                    case 1:
                        return "S";
                    case 2:
                        return "M";
                    case 3:
                        return "L";
                    case 4:
                        return "H";
                    default:
                        return moduleClass.ToString();
                }
            }
            else if (moduleSection == "Utility")
            {
                return "U";
            }
            else
            {
                return moduleClass.ToString();
            }
        }
    }
}