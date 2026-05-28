# PowerShell script to batch update Redux imports to Context
# Run this from the project root: .\batch-update-redux.ps1

$files = @(
    "src/app/pages/renter/AISearchWarehouse.tsx",
    "src/app/pages/renter/Bookmarks.tsx",
    "src/app/pages/renter/RentalRequests.tsx",
    "src/app/pages/renter/SearchWarehouse.tsx",
    "src/app/pages/renter/WarehouseDetail.tsx",
    "src/app/pages/warehouse/AddWarehouse.tsx",
    "src/app/pages/warehouse/CreateContract.tsx",
    "src/app/pages/warehouse/EditWarehouse.tsx",
    "src/app/pages/warehouse/MyWarehouses.tsx",
    "src/app/pages/warehouse/OwnerContracts.tsx",
    "src/app/pages/warehouse/SubscriptionManagement.tsx",
    "src/app/pages/warehouse/WarehouseRequests.tsx",
    "src/app/pages/employee/DataMigration.tsx",
    "src/app/pages/employee/ManageUsers.tsx",
    "src/app/pages/employee/ManageWarehouses.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Updating $file..." -ForegroundColor Yellow
        
        $content = Get-Content $file -Raw
        
        # Replace imports
        $content = $content -replace "import \{ useStoreContext \} from '[^']+/store/index';", "import { useApp } from '../../../context/AppContext';"
        $content = $content -replace "import \{ useAppSelector, useAppDispatch \} from '[^']+/store/hooks';", "import { useApp } from '../../../context/AppContext';"
        $content = $content -replace "import \{ useAppSelector \} from '[^']+/store/hooks';", "import { useApp } from '../../../context/AppContext';"
        $content = $content -replace "import \{ useAppDispatch \} from '[^']+/store/hooks';", "import { useApp } from '../../../context/AppContext';"
        
        # Remove slice imports (they're now methods on useApp)
        $content = $content -replace "import \{[^}]+\} from '[^']+/store/slices/[^']+';[\r\n]*", ""
        
        Set-Content $file -Value $content -NoNewline
        Write-Host "✓ Updated $file" -ForegroundColor Green
    } else {
        Write-Host "✗ File not found: $file" -ForegroundColor Red
    }
}

Write-Host "`nDone! Now manually update the hook usage in each file." -ForegroundColor Cyan
Write-Host "Pattern: const { user, warehouses, etc } = useApp();" -ForegroundColor Cyan
