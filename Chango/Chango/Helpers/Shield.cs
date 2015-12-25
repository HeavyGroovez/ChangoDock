using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Meta.Numerics;
using System.Text;

// THIS CLASS IS NOW DECLARED IN CHANGO.JS 

// Mike Evans forum post

// Take the base strength, look at the difference between hull mass and optimal mass and create a modifier to the base strength based on the linear interpolation 
// between the shields best and worst modifier depending on whether you're over or under weight.
// If you're exactly at the optimised mass then you'd get a modifier of 1 so no change.
// A C2 shield generator has 28t 55t 138t mass curve and modifier limits of 1.5 to 0.5. 
// So being at 28t would give you a modifier of 1.5 to base strength. 
// Being at 138t would give you a 0.5 modifier to base strength. 
// Being somewhere in between would be a linear interpolation of those values and 1.

// Coriolis implementation

//if (mass <= sg.minmass) {
//  return shields * multiplier * sg.minmul;
//}
//if (mass < sg.optmass) {
//  return shields * multiplier * (sg.minmul + (mass - sg.minmass) / (sg.optmass - sg.minmass) * (sg.optmul - sg.minmul));
//}
//if (mass < sg.maxmass) {
//  return shields * multiplier * (sg.optmul + (mass - sg.optmass) / (sg.maxmass - sg.optmass) * (sg.maxmul - sg.optmul));
//}
//return shields * multiplier * sg.maxmul;

namespace Chango.Helpers
{
    public class Shield
    {
        public double ShipBaseShield { get; set; }
        public double ShipHullMass { get; set; }
        public double OptMass { get; set; }
        public double MinMass { get; set; }
        public double MaxMass { get; set; }
        public double MaxMultiplier { get; set; }
        public double MinMultiplier { get; set; }
        public double OptMultiplier { get; set; }
        public double Booster { get; set; }

        public double Strength() 
        {
        
            if (ShipHullMass <= MinMass)
            {
                return (double)(ShipBaseShield * Booster * MinMultiplier);
            }

            if (ShipHullMass < OptMass)
            {
                return (double) (ShipBaseShield * Booster * (MinMultiplier + (ShipHullMass - MinMass) / (OptMass - MinMass) * (OptMultiplier - MinMultiplier)));
            }

            if (ShipHullMass < MaxMass)
            {
                return (double)(ShipBaseShield * Booster * (OptMultiplier + (ShipHullMass - OptMass) / (MaxMass - OptMass) * (MaxMultiplier - OptMultiplier)));
            }

            return (double)ShipBaseShield * Booster * MaxMultiplier;

      
        }
    }
}