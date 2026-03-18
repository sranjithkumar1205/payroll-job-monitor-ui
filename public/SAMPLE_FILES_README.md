# Sample CSV Files for Job Testing

This directory contains sample CSV files that can be used to test the Job Manual Trigger Dashboard's file upload functionality.

## Available Sample Files

### 1. **sample-employee-import.csv**
- **Use Case**: Employee Import job
- **Description**: Contains employee master data with personal and organizational information
- **Columns**:
  - EmployeeID: Unique employee identifier
  - FirstName, LastName: Employee names
  - Email: Corporate email address
  - Department: Organizational department
  - Position: Job title
  - Salary: Annual salary
  - StartDate: Employment start date
  - Status: Employment status (Active/Inactive)
- **Records**: 10 sample employees

### 2. **sample-payroll-data.csv**
- **Use Case**: Payroll Job execution
- **Description**: Contains monthly payroll data for salary processing
- **Columns**:
  - EmployeeID: Reference to employee
  - Month, Year: Payroll period
  - BaseSalary: Monthly base salary
  - Bonus: Performance bonus
  - Deductions: Tax and other deductions
  - NetSalary: Final net salary
  - BankAccount: Salary deposit account
- **Records**: 10 employee payroll records for March 2026

### 3. **sample-salary-sync.csv**
- **Use Case**: Salary Sync job
- **Description**: Contains salary data from two systems for synchronization verification
- **Columns**:
  - EmployeeID: Employee identifier
  - SystemA_Salary: Salary in System A
  - SystemB_Salary: Salary in System B
  - LastSyncDate: Previous sync timestamp
  - Status: Sync status (Synced/Mismatch)
  - Notes: Discrepancy details
- **Records**: 10 employee salary records with sync status

## How to Use These Files

1. **Download**: Access any of these files from the `public` folder
2. **Upload**: Use the Job Manual Trigger Dashboard to:
   - Select a job (Employee Import, Payroll Job, or Salary Sync)
   - Click "Choose File" and select the corresponding CSV file
   - Click "Run Job" to simulate processing
3. **Observe**: Watch the execution progress and view the result details

## File Format Notes

- All files use standard CSV format (comma-separated values)
- First row contains column headers
- Date formats: `YYYY-MM-DD` for dates, `YYYY-MM` for month/year
- Data is realistic but entirely fictional
- All salary amounts are in USD

## Customization

You can modify these files or create new ones with your own data. Ensure:
- Proper CSV formatting with commas as delimiters
- Consistent column naming
- Valid date formats where applicable
- No special characters that might break CSV parsing

## Testing Scenarios

### Scenario 1: Import New Employees
- Use: `sample-employee-import.csv`
- Job: Employee Import
- Expected: Successfully processed 10 new employee records

### Scenario 2: Process Monthly Payroll
- Use: `sample-payroll-data.csv`
- Job: Payroll Job
- Expected: Successfully processed payroll for 10 employees

### Scenario 3: Sync Salary Data
- Use: `sample-salary-sync.csv`
- Job: Salary Sync
- Expected: Identified 2 mismatches and synced records
