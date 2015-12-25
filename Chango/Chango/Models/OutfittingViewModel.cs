using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Diagnostics;

namespace Chango.Models
{
    public class OutfittingViewModel
    {
        public OutfittingViewModel()
        {
            Sections = new List<String>();
            Sections.Add("Standard");
            Sections.Add("Internal");
            Sections.Add("Hardpoint");
            Sections.Add("Utility");
        }

        public ShipBuild ShipBuild { get; set; }
        public Ship Ship { get; set; }
        public List<ShipModuleConfiguration> DefaultModuleConfiguration { get; set; }
        public List<ShipModuleBuild> ModuleBuild { get; set; }
        public List<Module> Modules { get; set; }
        public List<string> Sections { get; set; }

        public string GetModuleRenderMass(int configID)
        {
            Module mod = GetModule(configID);
            if (mod.Type != "Empty")
            {
                return mod.Mass.ToString() + " T";
            }
            else return "";
        }

        public string GetModuleRenderClass(int configID)
        { 
            ShipModuleConfiguration smc = DefaultModuleConfiguration.Find(dmc => dmc.ID == configID);
            if (smc.Section == "Hardpoint")
            {
                switch (smc.Class)
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
                        return smc.Class.ToString();
                }
            }
            else if (smc.Section == "Utility")
            {
                return "U";
            }
            else
            {
                return smc.Class.ToString();
            }
        }
        
        public string GetModuleRenderDescription(int configID)
        {
            Module mod = GetModule(configID); 
            if (mod.Type == "Cargo Rack")
            {
                return mod.Class + mod.Rating + " " + mod.Type + " [" + mod.Mass.ToString() + "]";
            }
            else if (mod.Type == "Exploration Scanner")
            {
                return mod.Name;
            }
            else if (mod.Type != "Empty")
            {
                return mod.Class + mod.Rating + " " + mod.Type;
            }
            else
            {
                return "Empty";
            }
        }

        public List<String> GetModuleRenderAttributes(int configID)
        {
            Module mod = GetModule(configID);
            List<String> attribs = new List<string>();
            
            try
            {

                if (mod.Attributes == null)
                {
                    // Chuck an empty attribute in the list
                    attribs.Add("");
                }
                else
                {
                    char[] sep = new char[] { ';' };
                    attribs = mod.Attributes.Split(sep).ToList<String>();
                }

            }

            catch (Exception ex)
            {
                Debug.WriteLine("Failed parsing " + mod.Attributes);
            }

            return attribs;
        }

        public Module GetModule(int configID) 
        {
            // Lookup the module for this bay in the build
            ShipModuleBuild smb = ModuleBuild.Where(dmb => dmb.ShipModuleConfigurationID == configID).FirstOrDefault();

            // We have the module id from the build corresponding to the current bay - lookup the module attributes
            Module mod = Modules.Find(m => m.ID == smb.ModuleID);

            return mod;
        }

        public ShipModuleBuild GetModuleBuild(int configID)
        {
            // Lookup the bay in the build
            ShipModuleBuild smb = ModuleBuild.Where(dmb => dmb.ShipModuleConfigurationID == configID).FirstOrDefault();
                        
            return smb;
        }

    }
}