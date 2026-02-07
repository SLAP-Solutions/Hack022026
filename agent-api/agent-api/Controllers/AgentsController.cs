using Microsoft.AspNetCore.Mvc;

namespace agent_api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class AgentsController : ControllerBase
    {
        private static readonly string[] Summaries =
        [
            "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
        ];

        [HttpGet("run")]
        public IEnumerable<WeatherForecast> RunAsync()
        {

        }
    }
}
