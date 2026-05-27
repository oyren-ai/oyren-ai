"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X } from "lucide-react"
import type React from "react"
import { useEffect, useMemo, useRef } from "react"

interface OpenPdf {
  id: string
  path: string
  name: string
}

interface NavbarPdfTabsProps {
  pdfs?: OpenPdf[]
  activePdfPath: string | null
  onSelectPdf: (path: string | null) => void
  onClosePdf: (path: string) => void
  loading?: boolean
}

const NavbarPdfTabs: React.FC<NavbarPdfTabsProps> = ({
  pdfs = [], // Default to empty array to prevent undefined error
  activePdfPath,
  onSelectPdf,
  onClosePdf,
  loading,
}: NavbarPdfTabsProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const activeValue = useMemo(() => activePdfPath ?? pdfs[pdfs.length - 1]?.id ?? null, [activePdfPath, pdfs])

  const handleTabClose = (tabPath: string, event: React.MouseEvent) => {
    event.stopPropagation()
    onClosePdf(tabPath)
  }

  useEffect(() => {
    if (!activeValue) return
    const activeTab = tabRefs.current[activeValue]
    const container = scrollContainerRef.current

    if (activeTab && container) {
      const tabRect = activeTab.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()

      // Scroll into view
      const offsetLeft = tabRect.left - containerRect.left
      const offsetRight = tabRect.right - containerRect.right

      if (offsetLeft < 0) {
        container.scrollLeft += offsetLeft
      } else if (offsetRight > 0) {
        container.scrollLeft += offsetRight
      }
    }
  }, [activeValue])

  if (pdfs.length === 0) {
    return null
  }

  return (
    <div className="flex-1 min-w-0 overflow-hidden">
      <Tabs value={activeValue ?? undefined} onValueChange={onSelectPdf}>
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto overflow-y-hidden whitespace-nowrap scroll-smooth pdf-tabs-scroll"
        >
          <TabsList className="h-8 inline-flex bg-transparent p-0 rounded-none items-stretch">
            {pdfs.map((pdf) => (
              <TabsTrigger
                key={pdf.id}
                value={pdf.id}
                ref={(node) => {
                  tabRefs.current[pdf.id] = node
                }}
                className="group relative h-8 min-w-[100px] max-w-[180px] rounded-none
                           bg-transparent 
                           hover:bg-neutral-100/40 dark:hover:bg-neutral-800/20
                           data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900
                           data-[state=active]:border-l data-[state=active]:border-l-neutral-300/40
                           dark:data-[state=active]:border-l-neutral-700/40
                           data-[state=active]:border-r data-[state=active]:border-r-neutral-300/40
                           dark:data-[state=active]:border-r-neutral-700/40
                           data-[state=active]:border-b data-[state=active]:border-b-neutral-300/40
                           dark:data-[state=active]:border-b-neutral-700/40
                           text-neutral-500 dark:text-neutral-500
                           data-[state=active]:text-neutral-900 dark:data-[state=active]:text-neutral-100
                           px-3.5 flex items-center justify-start gap-2 
                           transition-colors duration-200 ease-out
                           border-0 outline-none"
                data-testid={`tab-${pdf.id}`}
                onClick={() => onSelectPdf(pdf.path)}
              >
                <span
                  className="truncate flex-1 text-left text-[13px] leading-none font-normal
                             group-data-[state=active]:font-semibold
                             transition-colors duration-200"
                  title={pdf.name}
                >
                  {loading ? "Loading..." : pdf.name}
                </span>
                <span
                  className="h-3.5 w-3.5 opacity-0 group-hover:opacity-60 flex-shrink-0 
                             hover:opacity-100
                             flex items-center justify-center cursor-pointer 
                             transition-opacity duration-200 ease-out"
                  onClick={(e) => handleTabClose(pdf.path, e)}
                  data-testid={`tab-close-${pdf.id}`}
                >
                  <X
                    className="w-3 h-3 text-neutral-400 dark:text-neutral-500"
                  />
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>
    </div>
  )
}

export default NavbarPdfTabs
