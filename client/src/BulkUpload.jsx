import React, { useState } from 'react';
import * as XLSX from 'xlsx';

// A sleek modal for bulk uploading contracts via Excel
const BulkUpload = ({ isOpen, onClose, token }) => {
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('');
    const [progress, setProgress] = useState(0);
    const [contractTypes, setContractTypes] = useState([]);

    React.useEffect(() => {
        if (isOpen) {
            fetchContractTypes();
        }
    }, [isOpen]);

    const fetchContractTypes = async () => {
        try {
            const response = await fetch('/api/contract-types');
            const data = await response.json();
            if (data.types) {
                setContractTypes(data.types);
            }
        } catch (error) {
            console.error('Failed to fetch contract types:', error);
        }
    };

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            setStatus('');
        }
    };

    const parseExcel = (fileBlob) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
                resolve(json);
            };
            reader.onerror = (err) => reject(err);
            reader.readAsArrayBuffer(fileBlob);
        });
    };

    const handleUpload = async () => {
        if (!file) {
            setStatus('파일을 선택해주세요.');
            return;
        }
        try {
            setStatus('엑셀 파싱 중...');
            const rawContracts = await parseExcel(file);
            console.log('Parsed contracts:', rawContracts);

            if (!Array.isArray(rawContracts) || rawContracts.length === 0) {
                setStatus('엑셀에 계약 데이터가 없습니다.');
                return;
            }

            // Transform data: Map 'contract_type' (name) to 'contract_type_id'
            const typeMap = {};
            contractTypes.forEach(t => typeMap[t.name] = t.id);
            console.log('Type map:', typeMap);

            const contracts = rawContracts.map(c => {
                const newC = { ...c };

                // If user provided 'contract_type' (name), find the ID
                if (newC.contract_type) {
                    const typeName = String(newC.contract_type).trim();
                    const foundId = typeMap[typeName];
                    if (foundId) {
                        newC.contract_type_id = foundId;
                    } else {
                        console.warn(`Type not found for: "${typeName}"`);
                    }
                    delete newC.contract_type;
                }

                // Convert Excel date serial numbers to YYYY-MM-DD format
                const dateFields = ['contract_date', 'contract_end_date'];
                dateFields.forEach(field => {
                    if (newC[field]) {
                        // Check if it's an Excel serial number (number)
                        if (typeof newC[field] === 'number') {
                            // Excel serial date: days since 1900-01-01 (with 1900 leap year bug)
                            const excelEpoch = new Date(1899, 11, 30); // Dec 30, 1899
                            const date = new Date(excelEpoch.getTime() + newC[field] * 86400000);
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            newC[field] = `${year}-${month}-${day}`;
                        } else if (typeof newC[field] === 'string') {
                            // Already a string, check if it needs formatting
                            const dateStr = newC[field].trim();
                            // If it's already in YYYY-MM-DD format, keep it
                            if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                                // Try to parse and reformat
                                const parsed = new Date(dateStr);
                                if (!isNaN(parsed.getTime())) {
                                    const year = parsed.getFullYear();
                                    const month = String(parsed.getMonth() + 1).padStart(2, '0');
                                    const day = String(parsed.getDate()).padStart(2, '0');
                                    newC[field] = `${year}-${month}-${day}`;
                                }
                            }
                        }
                    }
                });

                // Remove fields that don't exist in DB
                delete newC.first_payment;

                // Set default values for required DB fields if empty
                if (!newC.phone_number || newC.phone_number === '') {
                    newC.phone_number = '-';
                }
                if (!newC.recipient_bank || newC.recipient_bank === '') {
                    newC.recipient_bank = '임시은행';
                }
                if (!newC.recipient_account || newC.recipient_account === '') {
                    newC.recipient_account = '임시계좌번호';
                }
                if (!newC.recipient_name || newC.recipient_name === '') {
                    newC.recipient_name = '미정';
                }

                return newC;
            });

            console.log('Transformed contracts:', contracts);

            // Validate that we have contract_type_id for all rows
            const invalidRow = contracts.find(c => !c.contract_type_id);
            if (invalidRow) {
                console.error('Invalid row:', invalidRow);
                setStatus('오류: 계약 종류(contract_type)가 올바르지 않은 항목이 있습니다. Reference_Types 시트를 참고하여 정확한 명칭을 입력해주세요.');
                return;
            }

            setStatus('서버에 업로드 중...');
            const response = await fetch('/api/contracts/bulk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                },
                body: JSON.stringify(contracts),
            });

            const result = await response.json();
            console.log('Server response:', result);

            if (response.ok) {
                setStatus(`성공! ${result.contracts ? result.contracts.length : '여러'}개의 계약이 등록되었습니다.`);
                setFile(null); // Reset file input
            } else {
                console.error('Upload failed:', result);
                setStatus(`업로드 실패: ${result.error || '알 수 없는 오류'}${result.details ? ' - ' + result.details : ''}`);
            }
        } catch (err) {
            console.error('Upload error:', err);
            setStatus(`예기치 않은 오류가 발생했습니다: ${err.message}`);
        }
    };

    const handleDownloadTemplate = () => {
        // Define headers - changed contract_type_id to contract_type (name)
        const headers = [
            'contract_type', // User inputs name (e.g. '전세')
            'contract_number',
            'contractor_name',
            'contract_date',
            'contract_end_date',
            'phone_number',
            'address',
            'email',
            'amount',
            'monthly_payment',
            'total_monthly_payment',
            'other_support',
            'recipient_bank',
            'recipient_account',
            'recipient_name',
            'memo'
        ];

        // Create a sample row with contract type NAME instead of ID
        const sampleData = [
            {
                contract_type: contractTypes.length > 0 ? contractTypes[0].name : '전세', // Use Name
                contract_number: '', // Leave empty for auto-generation
                contractor_name: '홍길동',
                contract_date: new Date().toISOString().split('T')[0],
                contract_end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
                phone_number: '010-1234-5678',
                address: '서울시 강남구',
                email: 'test@example.com',
                amount: 10000000,
                monthly_payment: 100000,
                total_monthly_payment: 100000,
                other_support: 0,
                recipient_bank: '신한은행',
                recipient_account: '110-123-456789',
                recipient_name: '홍길동',
                memo: '계약번호는 비워두면 자동 생성됩니다.'
            }
        ];

        const workbook = XLSX.utils.book_new();

        // 1. Main Data Sheet
        const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Contracts');

        // 2. Reference Sheet (Contract Types) - Updated to emphasize Name
        if (contractTypes.length > 0) {
            const typeData = contractTypes.map(t => ({
                'Type Name (Use this)': t.name,
                'Code': t.code,
                'ID': t.id
            }));
            const typeSheet = XLSX.utils.json_to_sheet(typeData);
            XLSX.utils.book_append_sheet(workbook, typeSheet, 'Reference_Types');
        }

        XLSX.writeFile(workbook, 'contract_upload_template.xlsx');
    };

    return (
        <div
            className={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            aria-hidden={!isOpen}
        >
            <div className={`bg-white/90 backdrop-filter backdrop-blur-lg rounded-xl shadow-xl w-full max-w-md p-6 transform transition-all duration-300 ${isOpen ? 'scale-100' : 'scale-95'}`}>
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">엑셀로 계약 일괄 등록</h2>

                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-sm text-blue-800 mb-3">
                        1. 먼저 양식을 다운로드하여 작성해주세요.<br />
                        2. 작성된 파일을 아래에 업로드해주세요.
                    </p>
                    <button
                        onClick={handleDownloadTemplate}
                        className="w-full flex items-center justify-center gap-2 bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 font-medium py-2 rounded-lg transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        양식 다운로드
                    </button>
                </div>

                <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-600 file:text-white hover:file:bg-primary-700 mb-4"
                />
                <button
                    onClick={handleUpload}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
                    disabled={!file}
                >
                    업로드
                </button>
                {status && <p className="mt-3 text-sm text-gray-700">{status}</p>}
                <button
                    onClick={onClose}
                    className="mt-4 w-full text-gray-600 hover:text-gray-800"
                >
                    닫기
                </button>
            </div>
        </div>
    );
};

export default BulkUpload;
