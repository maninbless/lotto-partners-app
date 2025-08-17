

import React, { useState, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { Type } from "@google/genai";

type Tab = 'lotto' | 'stock' | 'coupang';
type Deal = { name: string; description: string };

const CoupangAdBanner = () => {
    return (
        <div className="coupang-ad-banner">
            <iframe
                src="https://coupa.ng/cjv9wD"
                width="100%"
                height="75"
                frameBorder="0"
                scrolling="no"
                referrerPolicy="unsafe-url"
                // The `browsingtopics` attribute is a boolean attribute for the Privacy Sandbox API.
                // In React, it's common to pass boolean attributes this way.
                {...{ 'browsingtopics': 'true' }}
            ></iframe>
        </div>
    );
};

// =================================================================
// Tab Components (Moved outside of App component to prevent re-creation on re-render)
// =================================================================

interface TabProps {
    isLoadingDeals: boolean;
    renderRecommendations: React.ReactNode;
}

interface LottoTabProps extends TabProps {
    lottoNumbers: number[];
    isLoadingLotto: boolean;
    generateLottoNumbers: () => void;
}

const LottoTab: React.FC<LottoTabProps> = ({ lottoNumbers, isLoadingLotto, generateLottoNumbers, isLoadingDeals, renderRecommendations }) => (
    <div className="tab-content lotto-container">
        <h2 className="section-title">🍀 행운의 로또 번호</h2>
        <p className="description">버튼을 눌러 6개의 행운 번호를 받아보세요!</p>
        <div className="lotto-balls">
            {lottoNumbers.map((num, index) => <div key={index} className="lotto-ball">{num}</div>)}
        </div>
        <button className="action-button" onClick={generateLottoNumbers} disabled={isLoadingLotto}>
            {isLoadingLotto ? '생성 중...' : '행운 번호 받기'}
        </button>
        {(lottoNumbers.length > 0 || isLoadingDeals) && (
             <div className="recommendation-container">
                <h3 className="recommendation-title">
                    <span className="icon">🎁</span> 당첨되면 FLEX! 추천 아이템
                </h3>
                {renderRecommendations}
            </div>
        )}
    </div>
);

interface StockTabProps extends TabProps {
    stockQuery: string;
    setStockQuery: (value: string) => void;
    handleStockSubmit: (e: React.FormEvent) => void;
    isLoadingStock: boolean;
    stockResponse: string;
}

const StockTab: React.FC<StockTabProps> = ({ stockQuery, setStockQuery, handleStockSubmit, isLoadingStock, stockResponse, isLoadingDeals, renderRecommendations }) => (
    <div className="tab-content stock-container">
        <h2 className="section-title">📈 AI 주식 어드바이저</h2>
        <p className="description">궁금한 주식이나 시장 동향을 질문해보세요.</p>
        <form className="stock-form" onSubmit={handleStockSubmit}>
            <input
                type="text"
                className="stock-input"
                value={stockQuery}
                onChange={(e) => setStockQuery(e.target.value)}
                placeholder="예: 요즘 주목할만한 IT 주식은?"
            />
            <button type="submit" className="stock-submit" disabled={isLoadingStock}>질문</button>
        </form>
        <div className="stock-response">
            {isLoadingStock ? (
                <div className="loading-spinner"><div className="spinner"></div></div>
            ) : (
                <p>{stockResponse || 'AI의 답변이 여기에 표시됩니다.'}</p>
            )}
        </div>
        <p className="disclaimer">※ AI가 제공하는 정보는 투자 조언이 아니며, 참고용으로만 활용하시기 바랍니다.</p>
         {(stockResponse || isLoadingDeals) && (
             <div className="recommendation-container">
                <h3 className="recommendation-title">
                    <span className="icon">💡</span> 성공 투자를 위한 추천
                </h3>
                {renderRecommendations}
            </div>
        )}
    </div>
);

interface CoupangTabProps extends TabProps {
    fetchCoupangDeals: () => void;
}
    
const CoupangTab: React.FC<CoupangTabProps> = ({ fetchCoupangDeals, isLoadingDeals, renderRecommendations }) => (
    <div className="tab-content coupang-container">
         <h2 className="section-title">🛒 오늘의 쿠팡 추천</h2>
         <button className="action-button" onClick={fetchCoupangDeals} disabled={isLoadingDeals}>
            새로운 추천 받기
        </button>
         <div className="recommendation-container">
            {renderRecommendations}
         </div>
    </div>
);


const App = () => {
    const [activeTab, setActiveTab] = useState<Tab>('lotto');
    const [lottoNumbers, setLottoNumbers] = useState<number[]>([]);
    const [stockQuery, setStockQuery] = useState('');
    const [stockResponse, setStockResponse] = useState('');
    const [coupangDeals, setCoupangDeals] = useState<Deal[]>([]);
    
    const [isLoadingLotto, setIsLoadingLotto] = useState(false);
    const [isLoadingStock, setIsLoadingStock] = useState(false);
    const [isLoadingDeals, setIsLoadingDeals] = useState(false);

    const generateLottoNumbers = () => {
        setIsLoadingLotto(true);
        setLottoNumbers([]);
        const numbers = new Set<number>();
        while (numbers.size < 6) {
            numbers.add(Math.floor(Math.random() * 45) + 1);
        }
        setTimeout(() => {
            setLottoNumbers(Array.from(numbers).sort((a, b) => a - b));
            setIsLoadingLotto(false);
            fetchCoupangDeals('lotto');
        }, 500); // For animation effect
    };
    
    const handleStockSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stockQuery.trim()) return;

        setIsLoadingStock(true);
        setStockResponse('');
        try {
            const apiResponse = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: `다음 주식 관련 질문에 대해 초보자가 이해하기 쉽게 간단히 설명해줘: "${stockQuery}"`,
                }),
            });
            if (!apiResponse.ok) {
                throw new Error('API request failed');
            }
            const data = await apiResponse.json();
            setStockResponse(data.text);
            fetchCoupangDeals('stock', stockQuery);
        } catch (error) {
            console.error(error);
            setStockResponse('정보를 가져오는 데 실패했습니다. 다시 시도해주세요.');
        } finally {
            setIsLoadingStock(false);
        }
    };

    const fetchCoupangDeals = useCallback(async (context: 'lotto' | 'stock' | 'general', query?: string) => {
        setIsLoadingDeals(true);
        setCoupangDeals([]);
        let prompt = '';
        if (context === 'lotto') {
            prompt = '사람들이 로또 1등에 당첨되면 사고 싶어할 만한 흥미로운 상품 3가지를 추천해줘.';
        } else if (context === 'stock' && query) {
            prompt = `"${query}"와(과) 관련된 주제의 책이나 생산성 향상 아이템 3가지를 추천해줘.`;
        } else {
            prompt = '요즘 인기 있는 가전제품, 생활용품, 또는 취미용품 3가지를 추천해줘.';
        }

        try {
            const apiResponse = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: `${prompt} 각 상품의 이름과 1-2문장의 짧고 매력적인 설명을 포함해줘.`,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING, description: '상품 이름' },
                                    description: { type: Type.STRING, description: '상품에 대한 짧은 설명' },
                                },
                                required: ["name", "description"]
                            },
                        },
                    },
                }),
            });
            if (!apiResponse.ok) {
                throw new Error('API request failed');
            }
            const data = await apiResponse.json();
            const deals: Deal[] = JSON.parse(data.text);
            setCoupangDeals(deals);

        } catch (error) {
            console.error("Error fetching Coupang deals:", error);
        } finally {
            setIsLoadingDeals(false);
        }
    }, []);

    const renderRecommendations = useMemo(() => {
        if (isLoadingDeals) {
            return <div className="loading-spinner"><div className="spinner"></div></div>;
        }
        if (coupangDeals.length === 0) {
            // Do not show "loading" message if there are no deals yet.
            // It will be triggered by an action.
            return null; 
        }
        return coupangDeals.map((deal, index) => (
            <div key={index} className="deal-card" onClick={() => window.open('https://link.coupang.com/a/bF9cWJ', '_blank')}>
                <p className="deal-name">{deal.name}</p>
                <p className="deal-description">{deal.description}</p>
            </div>
        ));
    }, [isLoadingDeals, coupangDeals]);


    return (
        <div id="app">
            <header className="header">Lotto Stock Partners</header>
            <div className="disclosure-notice">
                이 포스팅은 쿠팡 파트너스 활동의 일환으로,이에 따른 일정액의 수수료를 제공받습니다.
            </div>
            <CoupangAdBanner />
            <main className="content">
                {activeTab === 'lotto' && (
                    <LottoTab 
                        lottoNumbers={lottoNumbers}
                        isLoadingLotto={isLoadingLotto}
                        generateLottoNumbers={generateLottoNumbers}
                        isLoadingDeals={isLoadingDeals}
                        renderRecommendations={renderRecommendations}
                    />
                )}
                {activeTab === 'stock' && (
                    <StockTab
                        stockQuery={stockQuery}
                        setStockQuery={setStockQuery}
                        handleStockSubmit={handleStockSubmit}
                        isLoadingStock={isLoadingStock}
                        stockResponse={stockResponse}
                        isLoadingDeals={isLoadingDeals}
                        renderRecommendations={renderRecommendations}
                    />
                )}
                {activeTab === 'coupang' && (
                    <CoupangTab
                        fetchCoupangDeals={() => fetchCoupangDeals('general')}
                        isLoadingDeals={isLoadingDeals}
                        renderRecommendations={renderRecommendations}
                    />
                )}
            </main>
            <nav className="nav">
                <div className={`nav-item ${activeTab === 'lotto' ? 'active' : ''}`} onClick={() => setActiveTab('lotto')}>
                    <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm-1-3h2v-2h-2zm0-4h2V7h-2z"/></svg>
                    로또
                </div>
                <div className={`nav-item ${activeTab === 'stock' ? 'active' : ''}`} onClick={() => setActiveTab('stock')}>
                    <svg fill="currentColor" viewBox="0 0 24 24"><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.09-4-4L2 17.08z"/></svg>
                    주식
                </div>
                <div className={`nav-item ${activeTab === 'coupang' ? 'active' : ''}`} onClick={() => setActiveTab('coupang')}>
                     <svg fill="currentColor" viewBox="0 0 24 24"><path d="M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-2c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2zm6 16H6V8h2v2c0 .55.45 1 1 1s1-.45 1-1V8h4v2c0 .55.45 1 1 1s1-.45 1-1V8h2v12z"/></svg>
                    쿠팡 추천
                </div>
            </nav>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('app')!);
root.render(<App />);