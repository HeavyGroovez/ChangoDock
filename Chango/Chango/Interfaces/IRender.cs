using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Data.Entity;
using Chango.Models;

namespace Chango.Interfaces
{
    public interface IRender
    {
        string RenderAsHTML(EliteContext db);
    }
}
