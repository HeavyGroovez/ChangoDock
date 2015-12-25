using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Chango.Helpers
{
    public static class Css
    {
        public static string GetModuleTypeSelectorStyle(string moduleGroup)
        {
            string moduleTypeGraphicStyle = "";

            if (moduleGroup == "Burst Laser" || moduleGroup == "Beam Laser" || moduleGroup == "Pulse Laser")
            {
                moduleTypeGraphicStyle += " moduleSelectorGraphicLaser";
            }
            else if (moduleGroup == "Multi-cannon" || moduleGroup == "Plasma Accelerator" || moduleGroup == "Rail Gun" || moduleGroup == "Cannon" || moduleGroup == "Fragment Cannon")
            {
                moduleTypeGraphicStyle += " moduleSelectorGraphicKinetic";
            }
            else if (moduleGroup == "Mining Laser")
            {
                moduleTypeGraphicStyle += " moduleSelectorGraphicMiningLaser";
            }
            else if (moduleGroup == "Mine Launcher" || moduleGroup == "Missile Rack Dumbfire" || moduleGroup == "Missile Rack Seeker" || moduleGroup == "Cannon" || moduleGroup == "Torpedo Pylon")
            {
                moduleTypeGraphicStyle += " moduleSelectorGraphicMissile";
            }
            else if (moduleGroup == "Bulkheads")
            {
                moduleTypeGraphicStyle += " moduleSelectorGraphicArmour";
            }
            else if (moduleGroup == "Exploration Scanner")
            {
                moduleTypeGraphicStyle += " moduleSelectorGraphicScanner";
            }
            else if (moduleGroup == "Auto Field-Maint. Unit")
            {
                moduleTypeGraphicStyle += " moduleSelectorGraphicScrewdriver";
            }
            else if (moduleGroup == "Cargo Scanner" || moduleGroup == "Kill Warrant Scanner" || moduleGroup == "Frame Shift Wake Scanner")
            {
                moduleTypeGraphicStyle += " moduleSelectorGraphicScanner";
            }
            else if (moduleGroup == "Chaff Launcher")
            {
                moduleTypeGraphicStyle += " moduleSelectorGraphicChaff";
            }
            else if (moduleGroup == "Electronic Countermeasure")
            {
                moduleTypeGraphicStyle += " moduleSelectorGraphicEcm";
            }
            else if (moduleGroup == "Heat Sink Launcher")
            {
                moduleTypeGraphicStyle += " moduleSelectorGraphicHeatsink";
            }
            else
            {
                moduleTypeGraphicStyle += " moduleSelectorGraphicStandard";
            }

            return moduleTypeGraphicStyle;
        }
    }
}