$outputPath = Join-Path $PSScriptRoot 'Affiliate_Project_Report.pdf'

$lines = @(
  '# Affiliate Management Project Report',
  'Project status and implemented functionality - 29 July 2026',
  '',
  '## 1. Project Overview',
  'This is a full-stack Affiliate Management SaaS platform for managing affiliates, referral links, customer conversions, commissions, and administrative controls.',
  'Frontend: React 19, React Router, Axios, responsive CSS interface.',
  'Backend: Node.js, Express, MVC with Service and Repository layers.',
  'Database: PostgreSQL / Supabase-compatible normalized schema.',
  'Deployment: Vercel frontend, Render backend, and Docker support.',
  '',
  '## 2. Roles and Access',
  'Super Admin: Full system control, settings, audit logs, and user administration.',
  'Admin: Affiliate/user management, commission rules, and reports.',
  'Super Affiliate: Dashboard, referral links, and team tracking.',
  'Standard Affiliate: Referral links, earnings, and conversion tracking.',
  '',
  '## 3. Completed Core Features',
  'Authentication: registration, login, logout, current-user API, refresh tokens, bcrypt password hashing, JWT authentication, and role-based authorization.',
  'Security: input validation, rate limiting, Helmet headers, CORS handling, centralized API errors, parameterized queries, indexes, and soft deletion.',
  'Affiliate tools: automatic referral-code generation, default links, campaign links, click tracking, click statistics, earnings, and commission statuses.',
  'Administration: user status management, audit logs, commission rules, system settings, and dashboard overview APIs.',
  '',
  '## 4. Customer Discount Through Affiliate Links',
  'Every valid affiliate link provides a 10% customer discount by default. It is configurable through AFFILIATE_DISCOUNT_PERCENT.',
  'Referral flow: a customer opens an affiliate URL, a unique click_id is created, and the store URL receives ref, click_id, and affiliate_discount=10.',
  'The storefront should validate the referral before applying the discount with GET /referrals/discount/:code.',
  'After payment, the storefront sends referralCode, clickId, orderId, final paid amount, and currency to POST /referrals/conversion.',
  'Important: the ecommerce storefront must preserve referral data through the cart and checkout. Its source code is not in this workspace.',
  '',
  '## 5. Standard Affiliate Commission Rules',
  'Commission is calculated on the final amount paid after the customer discount.',
  'Order value up to INR 1,000: 10% commission.',
  'Order value INR 1,001 to INR 1,500: 15% commission.',
  'Order value INR 1,501 to INR 2,000: 20% commission.',
  'Order value above INR 2,000: 20% commission continues.',
  'Examples: INR 800 earns INR 80; INR 1,200 earns INR 180; INR 1,800 earns INR 360; INR 2,500 earns INR 500.',
  'These tiers apply only to standard affiliates. Super affiliates and other roles use the active administrator-configured commission rule.',
  '',
  '## 6. Conversion and Commission Workflow',
  '1. Affiliate shares a generated referral link.',
  '2. Customer clicks it and a click event is stored.',
  '3. Customer purchases with the validated 10% discount.',
  '4. Store payment webhook calls POST /referrals/conversion after payment success.',
  '5. The platform creates a conversion and a pending commission.',
  '6. Duplicate order IDs cannot create duplicate commissions.',
  '7. Admin can set commission status to pending, approved, rejected, or paid.',
  '',
  '## 7. API Modules',
  '/auth - registration, login, logout, refresh token, and current user.',
  '/admin - user management and audit logs.',
  '/affiliates - referral links and affiliate earnings.',
  '/referrals - click tracking, discount validation, conversions, and team data.',
  '/commissions - commission rules and commission-status updates.',
  '/dashboard - role-specific dashboard summaries.',
  '/profile - profile read and update.',
  '/settings - system settings.',
  '',
  '## 8. Database Coverage',
  'The platform has 17 normalized tables for roles, permissions, users, profiles, affiliate links, clicks, referrals, conversions, commissions, withdrawals, transactions, notifications, logs, and settings.',
  '',
  '## 9. Frontend Updates',
  'The referral-link page shows the 10% customer discount, displays the standard affiliate commission slabs, and confirms the customer discount when an affiliate copies a link.',
  '',
  '## 10. Verification Status',
  'Backend JavaScript syntax checks and diff validation passed for the implemented changes.',
  'There is currently no automated backend test suite in the project.',
  'Frontend production build could not run locally because the Vite executable/dependencies are unavailable in the current environment.',
  '',
  '## 11. Production Checklist',
  'Configure DATABASE_URL, JWT secrets, FRONTEND_URL, CORS_ORIGIN, STOREFRONT_URL, and AFFILIATE_DISCOUNT_PERCENT=10.',
  'Integrate referral persistence, validation, and discount calculation in the live storefront checkout.',
  'Send the final discounted paid amount to the conversion API only after confirmed payment.',
  'Install frontend dependencies, run a production build, and add automated tests for eligibility, tiers, duplicate orders, and webhook security.'
)

function Wrap-Line([string]$line, [int]$width = 92) {
  if ($line.Length -le $width) { return @($line) }
  $result = @()
  $remaining = $line
  while ($remaining.Length -gt $width) {
    $cut = $remaining.LastIndexOf(' ', $width)
    if ($cut -lt 1) { $cut = $width }
    $result += $remaining.Substring(0, $cut).TrimEnd()
    $remaining = $remaining.Substring($cut).TrimStart()
  }
  $result += $remaining
  return $result
}

function Escape-Pdf([string]$text) {
  $text = [regex]::Replace($text, '[^\x20-\x7E]', '')
  return $text.Replace('\', '\\').Replace('(', '\(').Replace(')', '\)')
}

$wrappedLines = @()
foreach ($line in $lines) { $wrappedLines += Wrap-Line $line }
$pages = @()
for ($start = 0; $start -lt $wrappedLines.Count; $start += 43) {
  $end = [Math]::Min($start + 42, $wrappedLines.Count - 1)
  $pages += ,@($wrappedLines[$start..$end])
}

$objects = @{}
$objects[1] = '<< /Type /Catalog /Pages 2 0 R >>'
$kids = @()
for ($i = 0; $i -lt $pages.Count; $i++) { $kids += "$($i * 2 + 5) 0 R" }
$objects[2] = "<< /Type /Pages /Kids [ $($kids -join ' ') ] /Count $($pages.Count) >>"
$objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
$objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'

for ($i = 0; $i -lt $pages.Count; $i++) {
  $pageObject = $i * 2 + 5
  $contentObject = $pageObject + 1
  $content = "BT`n50 790 Td`n"
  foreach ($line in $pages[$i]) {
    if ([string]::IsNullOrWhiteSpace($line)) {
      $content += "0 -8 Td`n"
    } elseif ($line.StartsWith('# ')) {
      $content += "/F2 18 Tf ($((Escape-Pdf $line.Substring(2)))) Tj`n/F1 10 Tf 0 -24 Td`n"
    } elseif ($line.StartsWith('## ')) {
      $content += "/F2 13 Tf ($((Escape-Pdf $line.Substring(3)))) Tj`n/F1 10 Tf 0 -18 Td`n"
    } else {
      $content += "($((Escape-Pdf $line)) ) Tj`n0 -13 Td`n"
    }
  }
  $content += 'ET'
  $length = [System.Text.Encoding]::ASCII.GetByteCount($content)
  $objects[$pageObject] = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents $contentObject 0 R >>"
  $objects[$contentObject] = "<< /Length $length >>`nstream`n$content`nendstream"
}

$encoding = [System.Text.Encoding]::ASCII
$stream = New-Object System.IO.MemoryStream
function Write-Ascii([string]$value) { $bytes = $encoding.GetBytes($value); $stream.Write($bytes, 0, $bytes.Length) }
Write-Ascii "%PDF-1.4`n%PDF Report`n"
$offsets = @{}
$maxObject = 4 + ($pages.Count * 2)
for ($i = 1; $i -le $maxObject; $i++) {
  $offsets[$i] = $stream.Position
  Write-Ascii "$i 0 obj`n$($objects[$i])`nendobj`n"
}
$xref = $stream.Position
Write-Ascii "xref`n0 $($maxObject + 1)`n0000000000 65535 f `n"
for ($i = 1; $i -le $maxObject; $i++) { Write-Ascii ("{0:D10} 00000 n `n" -f $offsets[$i]) }
Write-Ascii "trailer`n<< /Size $($maxObject + 1) /Root 1 0 R >>`nstartxref`n$xref`n%%EOF"
[System.IO.File]::WriteAllBytes($outputPath, $stream.ToArray())
$stream.Dispose()
Write-Output "Created: $outputPath"
