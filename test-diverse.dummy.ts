/**
 * Dummy data for ReportExpense[]
 * Generated from: report-expense.json
 * 
 * This file is auto-generated. Do not edit manually.
 */

import { BaseApiResponse } from '@/types/api/api-general';
import dummyData from './test-diverse.dummy.json';

/**
 * Get dummy ReportExpense[] data
 * @returns Promise with BaseApiResponse containing ReportExpense[]
 */
export async function getReportExpenses(): Promise<BaseApiResponse<ReportExpense[]>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 200,
        status: 'success',
        message: 'Data retrieved successfully',
        data: dummyData as ReportExpense[],
      });
    }, 500);
  });
}
