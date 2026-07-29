[CmdletBinding()]
param(
    [switch]$Local
)

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$SqlPath = Join-Path $PSScriptRoot "product-metrics.sql"
$Wrangler = Join-Path $RepoRoot "node_modules\.bin\wrangler.cmd"
$Target = if ($Local) { "--local" } else { "--remote" }
$Sql = (Get-Content $SqlPath) -join " "

$Output = & $Wrangler d1 execute tegotae $Target --json --command $Sql
if ($LASTEXITCODE -ne 0) {
    throw "D1 metrics query failed with exit code $LASTEXITCODE"
}

$Payload = ($Output -join [Environment]::NewLine) | ConvertFrom-Json
$Row = $Payload[0].results[0]
if (-not $Row) {
    throw "D1 metrics query returned no result"
}

function Get-Percent {
    param([int]$Numerator, [int]$Denominator)
    if ($Denominator -eq 0) { return $null }
    return [Math]::Round(($Numerator / $Denominator) * 100, 1)
}

$Users = [int]$Row.users
$Creators = [int]$Row.creators
$SitesCreated = [int]$Row.sites_created
$SitesWithData = [int]$Row.sites_with_data

[ordered]@{
    generated_at = (Get-Date).ToUniversalTime().ToString("o")
    service = "tegotae"
    environment = if ($Local) { "local" } else { "production" }
    funnel = [ordered]@{
        users = $Users
        creators = $Creators
        sites_created = $SitesCreated
        snippet_copiers = [int]$Row.snippet_copiers
        link_savers = [int]$Row.link_savers
        sites_with_data = $SitesWithData
        dashboard_users = [int]$Row.dashboard_users
        returning_sites = [int]$Row.returning_sites
        returned_users = [int]$Row.returned_users
        measured_pageviews = [int]$Row.measured_pageviews
        users_7d = [int]$Row.users_7d
        creators_7d = [int]$Row.creators_7d
    }
    rates = [ordered]@{
        visitor_to_creator_percent = Get-Percent $Creators $Users
        creator_to_install_percent = Get-Percent $SitesWithData $SitesCreated
        installed_site_return_percent = Get-Percent ([int]$Row.returning_sites) $SitesWithData
        user_return_percent = Get-Percent ([int]$Row.returned_users) $Users
    }
} | ConvertTo-Json -Depth 4
