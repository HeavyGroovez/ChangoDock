using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Diagnostics;

namespace Chango.Models
{
    // Add methods in this partial definition to prevent EF overwriting on refresh
    public partial class Module
    {
        public int SelectorModuleClass {get; set;}
        public int SelectorConfigID { get; set; }
        public string SelectorShipName { get; set; }
        public string SelectorSection { get; set; }
        public bool SelectorPowerStatus { get; set; }

        public string GetRenderMass()
        {
            if (Type != "Empty")
            {
                return Mass.ToString() + " T";
            }
            else return "";
        }

       

        public string GetRenderDescription()
        {
            if (Type == "Cargo Rack")
            {
                return Class + Rating + " " + Type + " [" + Mass.ToString() + "]";
            }
            else if (Name != null )
            {
                return Class + Rating + " " + Name;
            }
            else if (Type != "Empty")
            {
                return Class + Rating + " " + Type;
            }
            else
            {
                return "Empty";
            }
        }

        public List<String> GetRenderAttributes()
        {
            
            List<String> attribs = new List<string>();

            try
            {

                if (Attributes == null)
                {
                    // Chuck an empty attribute in the list
                    attribs.Add("");
                }
                else
                {
                    char[] sep = new char[] { ';' };
                    attribs = Attributes.Split(sep).ToList<String>();
                }

            }

            catch (Exception ex)
            {
                Debug.WriteLine("Failed parsing " + Attributes);
            }

            return attribs;
        }
    }
}